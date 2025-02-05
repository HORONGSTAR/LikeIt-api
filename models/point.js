const Sequelize = require('sequelize')

module.exports = class Point extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 포인트 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 포인트변동
            changePoint: {
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
            tableName: 'point',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Point.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
