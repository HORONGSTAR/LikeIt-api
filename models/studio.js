const Sequelize = require('sequelize')

module.exports = class Studio extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 스튜디오 이름
            name: {
               type: Sequelize.STRING(200),
               allowNull: false,
               unique: true,
            },
            // 스튜디오 이미지 URL
            imgUrl: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
            // 스튜디오 소개
            intro: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
         },
         {
            sequelize,
            // 생성일, 갱신일, 해산일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'Studio',
            tableName: 'studios',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Studio.hasMany(db.StudioCommunity, {
         foreignKey: 'studioId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Studio.hasMany(db.Project, {
         foreignKey: 'studioId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Studio.hasMany(db.StudioAccount, {
         foreignKey: 'studioId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Studio.hasMany(db.StudioCreator, {
         foreignKey: 'studioId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Studio.belongsToMany(db.User, {
         through: 'StudioFavorite',
         foreignKey: 'studioId',
         otherKey: 'userId',
         onDelete: 'CASCADE',
      })
   }
}
