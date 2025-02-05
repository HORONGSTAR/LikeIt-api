const Sequelize = require('sequelize')

module.exports = class Category extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 카테고리 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 카테고리 이름
            categoryName: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
         },
         {
            sequelize,
            timestamps: false,
            paranoid: false,
            underscored: false,
            modelName: 'Category',
            tableName: 'category',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Category.hasMany(db.Project, {
         foreignKey: 'categoryId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Category.belongsToMany(db.Creator, {
         through: 'CreatorCategory',
         foreignKey: 'categoryId',
         otherKey: 'creatorId',
         onDelete: 'CASCADE',
      })
   }
}
