const Sequelize = require('sequelize')

module.exports = class ProjectReview extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
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
            modelName: 'ProjectReview',
            tableName: 'projectReviews',
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
      ProjectReview.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
         as: 'DirectReviews',
      })
      ProjectReview.belongsToMany(db.User, {
         through: 'ProjectReviewRecommend',
         foreignKey: 'reviewId',
         otherKey: 'userId',
         onDelete: 'CASCADE',
         as: 'ReviewsRecommends',
      })
   }
}
