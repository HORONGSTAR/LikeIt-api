const express = require('express')
const router = express.Router()

const { sequelize, User, ProjectReview, Order } = require('../models')
const { Sequelize } = require('sequelize')

// 후원자 통계 데이터 호출
router.get('/', async (req, res) => {
   try {
      const limit = 3
      const rankDatas = {}

      // 최다 리뷰
      const reviewCountRank = await User.findAll({
         limit,
         subQuery: false,
         attributes: ['id', 'name', 'imgUrl', [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('DirectReviews.id'))), 'userCount']],
         where: { role: 'USER' },
         include: [
            {
               model: ProjectReview,
               attributes: [],
               required: false,
               as: 'DirectReviews',
            },
         ],
         group: ['User.id'],
         order: [['userCount', 'DESC']],
      })
      rankDatas.reviewCountRank = reviewCountRank

      // 최다 후원
      const orderCountRank = await User.findAll({
         limit,
         subQuery: false,
         attributes: ['id', 'name', 'imgUrl', [Sequelize.fn('COUNT', Sequelize.fn('DISTINCT', Sequelize.col('Orders.createdAt'))), 'userCount']],
         where: { role: 'USER' },

         include: [
            {
               model: Order,
               attributes: [],
               required: false,
               where: {
                  orderPrice: { [Sequelize.Op.gt]: 0 },
               },
            },
         ],
         group: ['User.id'],
         order: [['userCount', 'DESC']],
      })
      rankDatas.orderCountRank = orderCountRank

      // 최고 금액 후원
      const orderTopRank = await User.findAll({
         limit,
         subQuery: false,
         attributes: ['id', 'name', 'imgUrl', [Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'priceCount']],
         where: { role: 'USER' },

         include: [
            {
               model: Order,
               attributes: [],
               required: false,
               where: {
                  orderPrice: { [Sequelize.Op.gt]: 0 },
               },
            },
         ],
         group: ['User.id'],
         order: [['priceCount', 'DESC']],
      })
      rankDatas.orderTopRank = orderTopRank

      res.json({
         success: true,
         ranks: rankDatas,
         message: '후원자 통계 데이터 호출 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '후원자 통계 데이터를 호출하는데 문제가 발생했습니다.' })
   }
})

// 로그인 유저 통계 호출
router.get('/:id', async (req, res) => {
   try {
      const { id } = req.params
      const query = `
WITH RankedUsers AS (
   SELECT 
      Users.id,
      COUNT(DISTINCT DirectReviews.id) AS reviewCount,
      COUNT(DISTINCT Orders.createdAt) AS orderCount,
      SUM(Orders.orderPrice) AS priceSum,
      RANK() OVER (ORDER BY COUNT(DISTINCT DirectReviews.id) DESC) AS reviewRank,
      RANK() OVER (ORDER BY COUNT(DISTINCT Orders.createdAt) DESC) AS orderRank,
      RANK() OVER (ORDER BY SUM(Orders.orderPrice) DESC) AS priceRank
   FROM Users
   LEFT JOIN ProjectReviews AS DirectReviews
      ON Users.id = DirectReviews.userId
      AND DirectReviews.deletedAt IS NULL
   LEFT JOIN Orders 
      ON Users.id = Orders.userId
      AND Orders.orderPrice >= 0
   WHERE Users.deletedAt IS NULL
   GROUP BY Users.id
)
SELECT * FROM RankedUsers WHERE id = :id;
`
      const myRank = await sequelize.query(query, {
         type: Sequelize.QueryTypes.SELECT,
         replacements: { id },
      })
      res.json({
         success: true,
         myRank: myRank[0],
         message: '후원자 통계 데이터 호출 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '로그인 유저 통계 데이터를 호출하는데 문제가 발생했습니다.' })
   }
})

module.exports = router
