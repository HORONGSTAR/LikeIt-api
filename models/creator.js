const Sequelize = require('sequelize')

module.exports = class Creator extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 수익금
            profit: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            paranoid: false,
            underscored: false,
            modelName: 'Creator',
            tableName: 'creators',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Creator.hasMany(db.StudioCreator, {
         foreignKey: 'creatorId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Creator.hasMany(db.CreatorProfit, {
         foreignKey: 'creatorId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Creator.belongsToMany(db.Category, {
         through: 'CreatorCategory',
         foreignKey: 'creatorId',
         otherKey: 'categoryId',
         onDelete: 'CASCADE',
      })
      Creator.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
