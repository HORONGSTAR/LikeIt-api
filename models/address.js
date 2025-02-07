const Sequelize = require('sequelize')

module.exports = class Address extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 주소지
            address: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
            // 기본 주소지 여부
            default: {
               type: Sequelize.ENUM('Y', 'N'),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Address',
            tableName: 'addresses',
            paranoid: false,
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Address.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
