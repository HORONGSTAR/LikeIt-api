const Sequelize = require('sequelize')

module.exports = class ProjectTimeline extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 타임라인 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 제목
            title: {
               type: Sequelize.STRING(200),
               allowNull: false,
               unique: true,
            },
            // 내용
            contents: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            // 추천수
            recommend: {
               type: Sequelize.INTEGER,
               defaultValue: 0,
            },
         },
         {
            sequelize,
            // 등록일, 수정일, 삭제일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'ProjectTimeline',
            tableName: 'projectTimeline',
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
      ProjectTimeline.hasMany(db.ProjectTimelineImg, {
         foreignKey: 'timelineId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      ProjectTimeline.hasMany(db.ProjectTimelineComment, {
         foreignKey: 'timelineId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
