const Sequelize = require('sequelize')

// 홈 화면에 광고로 표시될 프로젝트들
module.exports = class BannerProject extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 배너 이미지 URL
            imgUrl: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
         },
         {
            sequelize,
            // 등록일, 삭제일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'BannerProject',
            tableName: 'bannerProjects',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      BannerProject.belongsTo(db.Project, {
         foreignKey: 'projectId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
