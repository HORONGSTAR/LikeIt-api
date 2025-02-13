const Sequelize = require('sequelize')

module.exports = class User extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 이메일
            email: {
               type: Sequelize.STRING(100),
               allowNull: false,
               unique: true,
            },
            // 비밀번호
            password: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
            // 닉네임
            name: {
               type: Sequelize.STRING(100),
               allowNull: false,
               unique: true,
            },
            // 연락처
            phone: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
            // 프로필 사진
            imgUrl: {
               type: Sequelize.STRING(100),
               allowNull: true,
               defaultValue: '/default_profile.png',
            },
            // 포인트
            point: {
               type: Sequelize.INTEGER,
               defaultValue: 0,
            },
            // 권한
            role: {
               type: Sequelize.ENUM('ADMIN', 'USER'),
            },
         },
         {
            sequelize,
            // 가입일, 갱신일, 탈퇴일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'User',
            tableName: 'users',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      User.belongsToMany(db.Studio, {
         through: 'StudioFavorite',
         foreignKey: 'userId',
         otherKey: 'studioId',
         onDelete: 'CASCADE',
      })
      User.belongsToMany(db.Project, {
         through: 'ProjectFavorite',
         foreignKey: 'userId',
         otherKey: 'projectId',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.StudioCommunity, {
         foreignKey: 'userId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.StudioCommunityComment, {
         foreignKey: 'userId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.Address, {
         foreignKey: 'userId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.Point, {
         foreignKey: 'userId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.Message, {
         foreignKey: 'sendUserId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.Message, {
         foreignKey: 'receiveUserId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.UserAccount, {
         foreignKey: 'userId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.Order, {
         foreignKey: 'userId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.hasMany(db.ProjectTimelineComment, {
         foreignKey: 'userId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      User.belongsToMany(db.ProjectReview, {
         through: 'ProjectReviewRecommend',
         foreignKey: 'userId',
         otherKey: 'reviewId',
         onDelete: 'CASCADE',
      })
      User.hasOne(db.Creator, {
         foreignKey: 'userId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
