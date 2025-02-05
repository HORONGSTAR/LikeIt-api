const Sequelize = require('sequelize')

module.exports = class RewardProduct extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 구성품 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 제목
            title: {
               type: Sequelize.STRING(200),
               allowNull: false,
            },
            // 설명
            contents: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
            // 이미지 URL
            imgUrl: {
               type: Sequelize.STRING(200),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            paranoid: false,
            underscored: false,
            modelName: 'RewardProduct',
            tableName: 'rewardProduct',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      RewardProduct.belongsToMany(db.Reward, {
         through: 'RewardProductRelation',
         foreignKey: 'productId',
         otherKey: 'rewardId',
         onDelete: 'CASCADE',
      })
      RewardProduct.belongsTo(db.Project, {
         foreignKey: 'projectId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
