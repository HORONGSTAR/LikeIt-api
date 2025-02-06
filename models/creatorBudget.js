const Sequelize = require('sequelize')

module.exports = class CreatorBudget extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 내용
            contents: {
               type: Sequelize.STRING(200),
               allowNull: false,
            },
            // 정산비율
            money: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            paranoid: false,
            underscored: false,
            modelName: 'CreatorBudget',
            tableName: 'creatorBudgets',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      CreatorBudget.belongsTo(db.Project, {
         foreignKey: 'projectId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      CreatorBudget.belongsTo(db.StudioCreator, {
         foreignKey: 'studioCreatorId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
