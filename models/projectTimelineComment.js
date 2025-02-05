const Sequelize = require('sequelize')

module.exports = class ProjectTimelineComment extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 댓글 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 내용
            comment: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
         },
         {
            sequelize,
            // 작성시간, 수정시간, 삭제시간
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'ProjectTimelineComment',
            tableName: 'projectTimelineComment',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      ProjectTimelineComment.belongsTo(db.ProjectTimeline, {
         foreignKey: 'timelineId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      ProjectTimelineComment.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
