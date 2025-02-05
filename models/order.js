const Sequelize = require('sequelize')

module.exports = class Order extends Sequelize.Model {
   static init(sequelize) {
      return super.init(
         {
            // 주문 id
            id: {
               type: Sequelize.INTEGER,
               primaryKey: true,
            },
            // 주문수량
            orderCount: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
            // 주문금액
            orderPrice: {
               type: Sequelize.INTEGER,
               allowNull: false,
            },
            // 배송지
            address: {
               type: Sequelize.STRING(500),
               allowNull: false,
            },
            // 출금계좌
            account: {
               type: Sequelize.STRING(100),
               allowNull: true,
            },
            // 운송장
            bill: {
               type: Sequelize.STRING(200),
               allowNull: true,
            },
            // 주문상황 (펀딩진행중, 펀딩성공/결제완료, 펀딩성공/결제실패, 펀딩실패, 전달준비중, 전달시작, 전달완료)
            orderStatus: {
               type: Sequelize.ENUM('ON_FUNDING', 'FUNDING_COMPLETE_PAID', 'FUNDING_COMPLETE_NOT_PAID', 'FUNDING_FAILED', 'DELIVERY_WAITING', 'DELIVERY_STARTED', 'DELIVERY_COMPLETE'),
               defaultValue: 'ON_FUNDING',
            },
         },
         {
            sequelize,
            // 주문일, 갱신일, 취소일
            timestamps: true,
            paranoid: true,
            underscored: false,
            modelName: 'Order',
            tableName: 'order',
            charset: 'utf8mb4',
            collate: 'utf8mb4_general_ci',
         }
      )
   }

   static associate(db) {
      Order.belongsTo(db.User, {
         foreignKey: 'userId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
      Order.belongsTo(db.Reward, {
         foreignKey: 'rewardId',
         targetKey: 'id',
         onDelete: 'CASCADE',
      })
   }
}
