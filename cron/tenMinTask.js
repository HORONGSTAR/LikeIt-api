const { CronJobLog } = require('../models')

module.exports = async () => {
   let taskName = '10minuteTask'
   let logEntry

   try {
      console.log(`[${taskName}] 작업 시작`)
      // logEntry = await CronJobLog.create({ taskName, status: 'SUCCESS' })

      console.log(`[${taskName}] 작업 완료`)
   } catch (error) {
      console.error(`[${taskName}] 오류 발생:`, error)
   }
}
