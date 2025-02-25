const Sequelize = require('sequelize')

module.exports = class Project extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 프로젝트명
            title: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
            // 목표후원금
            goal: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
            // 한줄소개
            intro: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
            // 소개본문
            contents: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            // 일정표
            schedule: {
               type: Sequelize.TEXT,
               allowNull: false,
            },
            // 이미지
            imgUrl: {
               type: Sequelize.STRING(100),
               allowNull: false,
            },
            // 관리자메모(미승인시 사유)
            adminMemo: {
               type: Sequelize.STRING(500),
               allowNull: true,
            },
            // 펀딩시작일
            startDate: {
               type: Sequelize.DATE,
               allowNull: false,
            },
            // 펀딩마감일
            endDate: {
               type: Sequelize.DATE,
               allowNull: false,
            },
            // 진행상태 (펀딩진행중, 시작대기중, 펀딩성공, 펀딩실패)
            projectStatus: {
               type: Sequelize.ENUM('ON_FUNDING', 'WAITING_FUNDING', 'FUNDING_COMPLETE', 'FUNDING_FAILED'),
            },
            // 승인상태 (작성중, 승인요청, 승인허가, 승인거부)
            proposalStatus: {
               type: Sequelize.ENUM('WRITING', 'REVIEW_REQ', 'COMPLETE', 'DENIED'),
               defaultValue: 'WRITING',
            },
         },
         {
            sequelize,
            // 등록일, 수정일, 취소일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'Project',
            tableName: 'projects',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Project.hasMany(db.ProjectReview, {
         foreignKey: 'projectId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.hasMany(db.Reward, {
         foreignKey: 'projectId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.hasMany(db.Order, {
         foreignKey: 'projectId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.hasMany(db.ProjectTimeline, {
         foreignKey: 'projectId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.hasMany(db.RewardProduct, {
         foreignKey: 'projectId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.hasMany(db.ProjectBudget, {
         foreignKey: 'projectId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.hasMany(db.CreatorBudget, {
         foreignKey: 'projectId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.hasOne(db.BannerProject, {
         foreignKey: 'projectId',
         sourceKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.belongsTo(db.Studio, {
         foreignKey: 'studioId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.belongsTo(db.Category, {
         foreignKey: 'categoryId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      Project.belongsToMany(db.User, {
         through: 'ProjectFavorite',
         foreignKey: 'projectId',
         otherKey: 'userId',
         onDelete: 'CASCADE',
      })
   }
}
