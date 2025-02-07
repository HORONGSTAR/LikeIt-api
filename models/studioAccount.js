const Sequelize = require('sequelize')

module.exports = class StudioAccount extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 계정종류
            type: {
               type: Sequelize.ENUM('INSTAGRAM', 'YOUTUBE', 'X'),
               allowNull: false,
            },
            // 링크
            contents: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            paranoid: false,
            underscored: false,
            modelName: 'StudioAccount',
            tableName: 'studioAccounts',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      StudioAccount.belongsTo(db.Studio, {
         foreignKey: 'studioId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
