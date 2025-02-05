const Sequelize = require('sequelize')

module.exports = class Reward extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 리워드 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 리워드금액
            price: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
            // 리워드명
            name: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
            // 리워드내용
            contents: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
            // 리워드재고
            stock: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
            // 인당제한
            limit: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            paranoid: false,
            underscored: false,
            modelName: 'Reward',
            tableName: 'reward',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Reward.belongsTo(db.Project, {
         foreignKey: 'projectId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      Reward.belongsToMany(db.RewardProduct, {
         through: 'RewardProductRelation',
         foreignKey: 'rewardId',
         otherKey: 'productId',
         onDelete: 'CASCADE',
      })
      Reward.hasMany(db.Order, {
         foreignKey: 'rewardId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
