const express = require('express')
const router = express.Router()

const { BannerProject, User, ProjectReview, Order } = require('../models')
const { Sequelize } = require('sequelize')

router.get('/', async (req, res) => {
   res.send('서버가 정상적으로 실행 중입니다.')
})

// 배너 프로젝트 호출
router.get('/banner', async (req, res) => {
   try {
      const banners = await BannerProject.findAll({})
      res.json({
         success: true,
         banners,
         message: '배너 프로젝트 호출 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '배너 프로젝트를 호출하는데 문제가 발생했습니다.' })
   }
})

// 후원자 통계 데이터 호출
router.get('/rank', async (req, res) => {
   try {
      const limit = 3
      const rankDatas = {}

      // 최다 리뷰
      const reviewCountRank = await User.findAll({
         limit,
         subQuery: false,
         attributes: {
            include: [[Sequelize.fn('COUNT', Sequelize.col('ProjectReviews.id')), 'userCount']],
         },
         include: [
            {
               model: ProjectReview,
               attributes: [],
               required: false,
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
         attributes: {
            include: [[Sequelize.fn('COUNT', Sequelize.col('Orders.id')), 'userCount']],
         },
         include: [
            {
               model: Order,
               attributes: [],
               required: false,
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
         attributes: {
            include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'priceCount']],
         },
         include: [
            {
               model: Order,
               attributes: [],
               required: false,
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

module.exports = router
