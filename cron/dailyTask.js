const { Sequelize } = require('sequelize')
const { CronJobLog, Project, Order } = require('../models')

module.exports = async () => {
   let taskName = 'fundingStart'
   let logEntry

   try {
      // 승인받았고 시작일이 된 프로젝트들 펀딩 시작
      console.log(`${taskName} 작업 시작`)
      logEntry = await CronJobLog.create({ taskName, status: 'SUCCESS' })
      const fundingStart = await Project.findAll({
         where: {
            startDate: { [Sequelize.Op.lt]: new Date() },
            projectStatus: 'WAITING_FUNDING',
            proposalStatus: 'COMPLETE',
         },
      })

      if (fundingStart.length > 0) {
         await Promise.all(fundingStart.map((project) => project.update({ projectStatus: 'ON_FUNDING' })))
      }
      await logEntry.update({ finishedAt: new Date() })
      console.log(`[${taskName}] 작업 완료`)

      // 펀딩 기간이 끝난 프로젝트 성공 or 실패 판정
      taskName = 'fundingEnd'
      console.log(`${taskName} 작업 시작`)
      logEntry = await CronJobLog.create({ taskName, status: 'SUCCESS' })
      const fundingEnd = await Project.findAll({
         where: {
            endDate: { [Sequelize.Op.lt]: new Date() },
            projectStatus: 'ON_FUNDING',
         },
         attributes: {
            include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']],
         },
         include: [
            {
               model: Order,
               attributes: [],
               required: false,
            },
         ],
         group: ['Project.id'],
      })
      fundingEnd.forEach((project) => {
         const totalOrderPrice = project.get('totalOrderPrice') || 0
         if (totalOrderPrice >= project.goal) {
            project.update({ projectStatus: 'FUNDING_COMPLETE' })
         } else {
            project.update({ projectStatus: 'FUNDING_FAILED' })
         }
      })
      // order 변경

      //
      await logEntry.update({ finishedAt: new Date() })

      console.log(`[${taskName}] 작업 완료`)
   } catch (error) {
      console.error(`[${taskName}] 오류 발생:`, error)
      if (logEntry) {
         await logEntry.update({
            status: 'FAIL',
            errorMessage: error.message,
            finishedAt: new Date(),
         })
      }
   }
}
