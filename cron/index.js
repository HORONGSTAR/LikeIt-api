const cron = require('node-cron')
const tenMinTask = require('./tenMinTask')
const dailyTask = require('./dailyTask')

module.exports = () => {
   console.log('Cron 작업 시작')
   // 서버 시작 시 dailyTask 1회 실행
   dailyTask()

   // 10분마다 한번씩 실행
   cron.schedule('*/10 * * * *', tenMinTask)

   // 매일 자정에 실행
   cron.schedule('1 0 * * *', dailyTask)
   console.log('Cron 작업 등록 성공')
}
