const Sequelize = require('sequelize')

module.exports = class RewardProductRelation extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 리워드 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 수량
            stock: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
         },
         {
            sequelize,
            timestamps: false,
            paranoid: false,
            underscored: false,
            modelName: 'RewardProductRelation',
            tableName: 'rewardProductRelation',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      RewardProductRelation.belongsTo(db.Reward, {
         foreignKey: 'rewardId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      RewardProductRelation.belongsTo(db.RewardProduct, {
         foreignKey: 'productId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
