const Sequelize = require('sequelize')

module.exports = class ProjectReview extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 리뷰 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 별점
            star: {
               type: Sequelize.FLOAT,
               allowNull: false,
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
            modelName: 'ProjectReview',
            tableName: 'projectReview',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      ProjectReview.belongsTo(db.Project, {
         foreignKey: 'projectId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      ProjectReview.hasMany(db.ProjectReviewImg, {
         foreignKey: 'reviewId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
