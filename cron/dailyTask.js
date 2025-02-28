const { Sequelize } = require('sequelize')

const { sequelize, CronJobLog, Project, Order, Message, User } = require('../models')

module.exports = async () => {
   let taskName = 'fundingStart'
   let logEntry
   logEntry = await CronJobLog.create({ taskName, status: 'SUCCESS' })
   try {
      // 승인받았고 시작일이 된 프로젝트들 펀딩 시작 (알림 쪽지 추가)
      console.log(`${taskName} 작업 시작`)
      const fundingStart = await Project.findAll({
         where: {
            startDate: { [Sequelize.Op.lt]: new Date() },
            projectStatus: 'WAITING_FUNDING',
            proposalStatus: 'COMPLETE',
         },
         include: [
            {
               model: User,
               through: 'ProjectFavorite',
               attributes: ['id'],
            },
         ],
      })
      if (fundingStart.length > 0) {
         const messages = []
         await Promise.all(fundingStart.map((project) => project.update({ projectStatus: 'ON_FUNDING' })))
         fundingStart.forEach((project) => {
            const projectUsers = project.Users.map((user) => user.id)
            projectUsers.forEach((userId) => {
               messages.push({
                  receiveUserId: userId,
                  sendUserId: 1,
                  message: `${project.title} 프로젝트의 펀딩이 시작되었습니다!`,
                  imgId: project.id,
                  imgType: 'PROJECT',
               })
            })
         })
         await Message.bulkCreate(messages)
      }
      await Message.bulkCreate({})
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

   taskName = 'fundingEnd'
   logEntry = await CronJobLog.create({ taskName, status: 'SUCCESS' })
   const transaction = await sequelize.transaction()
   try {
      // 펀딩 기간이 끝난 프로젝트 성공 or 실패 판정 (알림 쪽지 추가)
      console.log(`${taskName} 작업 시작`)
      const fundingEnd = await Project.findAll({
         subQuery: false,
         where: {
            endDate: { [Sequelize.Op.lt]: new Date() },
            projectStatus: 'ON_FUNDING',
         },
         include: [
            {
               model: Order,
               attributes: ['userId', 'orderPrice'],
               required: false,
               where: {
                  orderPrice: { [Sequelize.Op.gt]: 0 },
               },
            },
         ],
         group: ['Project.id', 'Orders.id'],
         transaction,
      })
      const messages = []
      for (const project of fundingEnd) {
         const totalOrderPrice = project.Orders.reduce((sum, order) => {
            return sum + order.orderPrice
         }, 0)
         const projectUsers = project.Orders.map((order) => order.userId)
         const processedUsers = new Set()
         for (const userId of projectUsers) {
            if (processedUsers.has(userId)) continue
            messages.push({
               receiveUserId: userId,
               sendUserId: 1,
               message: `${project.title} 프로젝트의 펀딩이 완료되었습니다!`,
               imgId: project.id,
               imgType: 'PROJECT',
            })
            processedUsers.add(userId)
         }

         if (totalOrderPrice >= project.goal) {
            await project.update({ projectStatus: 'FUNDING_COMPLETE' }, { transaction })
         } else {
            await project.update({ projectStatus: 'FUNDING_FAILED' }, { transaction })
         }
         await Order.update({ orderStatus: 'FUNDING_COMPLETE_PAID' }, { where: { projectId: project.id }, transaction })
      }
      await Message.bulkCreate(messages, { transaction })
      await transaction.commit()
      await logEntry.update({ finishedAt: new Date() })
      console.log(`[${taskName}] 작업 완료`)
   } catch (error) {
      console.error(`[${taskName}] 오류 발생:`, error)
      await transaction.rollback()
      if (logEntry) {
         await logEntry.update({
            status: 'FAIL',
            errorMessage: error.message,
            finishedAt: new Date(),
         })
      }
   }
}
