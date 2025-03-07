const Sequelize = require('sequelize')

module.exports = class ProjectTimeline extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 제목
            title: {
               type: Sequelize.STRING(200),
               allowNull: false,
            },
            // 내용
            contents: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            // 이미지 경로
            imgUrl: {
               type: Sequelize.STRING(200),
            },
         },
         {
            sequelize,
            // 등록일, 수정일, 삭제일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'ProjectTimeline',
            tableName: 'projectTimelines',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      ProjectTimeline.belongsTo(db.Project, {
         foreignKey: 'projectId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      ProjectTimeline.hasMany(db.ProjectTimelineComment, {
         foreignKey: 'timelineId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
