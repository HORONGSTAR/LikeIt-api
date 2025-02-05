const Sequelize = require('sequelize')

module.exports = class ProjectBudget extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 예산 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 내용
            contents: {
               type: Sequelize.STRING(200),
               allowNull: false,
            },
            // 금액
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
            modelName: 'ProjectBudget',
            tableName: 'projectBudget',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      ProjectBudget.belongsTo(db.Project, {
         foreignKey: 'projectId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
