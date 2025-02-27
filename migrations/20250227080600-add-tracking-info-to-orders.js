'use strict'

/** @type {import('sequelize-cli').Migration} */
module.exports = {
   up: async (queryInterface, Sequelize) => {
      // orderTrackingNumber 컬럼 추가
      await queryInterface.addColumn('orders', 'orderTrackingNumber', {
         type: Sequelize.STRING(100),
         allowNull: true, // 운송장 번호는 없을 수도 있기 때문에 allowNull: true
      })

      // shippingCompany 컬럼 추가
      await queryInterface.addColumn('orders', 'shippingCompany', {
         type: Sequelize.STRING(100),
         allowNull: true, // 택배사도 없을 수 있기 때문에 allowNull: true
      })
   },

   down: async (queryInterface, Sequelize) => {
      // `down` 메서드는 이 마이그레이션을 되돌릴 때 사용됩니다.
      await queryInterface.removeColumn('orders', 'orderTrackingNumber')
      await queryInterface.removeColumn('orders', 'shippingCompany')
   },
}
