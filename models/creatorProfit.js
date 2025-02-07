const Sequelize = require('sequelize')

module.exports = class creatorProfit extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 수익금변동
            changeProfit: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
            // 변동사유
            changeComment: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
         },
         {
            sequelize,
            // 변동일
            timestamps: true,
            underscored: false,
            modelName: 'Point',
            tableName: 'points',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      creatorProfit.belongsTo(db.Creator, {
         foreignKey: 'creatorId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
