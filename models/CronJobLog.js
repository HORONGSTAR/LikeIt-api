const Sequelize = require('sequelize')

module.exports = class CronJobLog extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 작업명
            taskName: {
               type: Sequelize.STRING,
               allowNull: false,
            },
            // 실행결과
            status: {
               type: Sequelize.ENUM('SUCCESS', 'FAIL'),
               allowNull: false,
            },
            // 실패 시 오류 메시지 저장
            errorMessage: {
               type: Sequelize.TEXT,
               allowNull: true,
            },
            // 작업 종료 시간
            finishedAt: {
               type: Sequelize.DATE,
               allowNull: true,
            },
         },
         {
            sequelize,
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'CronJobLog',
            tableName: 'cronJobLogs',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {}
}
