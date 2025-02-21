const express = require('express')
const { Studio, Project, User, Order, Reward, RewardProduct, ProjectBudget, ProjectTimeline, ProjectTimelineComment, ProjectReview } = require('../models')
const router = express.Router()

const { Sequelize } = require('sequelize')
const { isLoggedIn } = require('./middlewares')

// 특정 프로젝트 호출
router.get('/:id', async (req, res) => {
   try {
      const { id } = req.params
      const funding = await Project.findOne({
         subQuery: false,
         where: { id },
         include: [
            {
               model: Studio,
               attributes: ['id', 'name', 'intro', 'imgUrl', [Sequelize.fn('COUNT', Sequelize.col('Studio.Users.id')), 'subscribers']],
               include: [
                  {
                     model: User,
                     through: {
                        attributes: [],
                     },
                     attributes: [],
                  },
               ],
            },
            {
               model: Order,
               attributes: [],
               required: false,
            },
            {
               model: Reward,
               required: false,
               include: [
                  {
                     model: RewardProduct,
                     through: {
                        attributes: ['stock'],
                     },
                  },
               ],
            },
            {
               model: ProjectBudget,
            },
         ],
         attributes: {
            include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']],
         },
         group: ['Rewards.id', 'Rewards.RewardProducts.id', 'ProjectBudgets.id'],
      })
      res.json({
         success: true,
         message: '펀딩 프로젝트 조회 성공',
         funding,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({
         success: false,
         message: '펀딩 프로젝트를 불러오는데 문제가 발생했습니다.',
      })
   }
})

// 타임라인 게시물 호출
router.get('/timeline/:id', async (req, res) => {
   try {
      const { id } = req.params // 프로젝트 id
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 3
      const offset = (page - 1) * limit
      const timelineCount = await ProjectTimeline.count({
         where: { projectId: id },
      })

      const timelines = await ProjectTimeline.findAll({
         limit,
         offset,
         where: { projectId: id },
      })

      res.json({
         success: true,
         message: '타임라인 목록 조회 성공',
         timelines,
         timelineCount,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '타임라인 목록을 호출하는 중에 오류가 발생했습니다.' })
   }
})

// 특정 타임라인 + 댓글 호출
router.get('/timeline/detail/:id', async (req, res) => {
   try {
      const { id } = req.params // 타임라인 id

      const timeline = await ProjectTimeline.findOne({
         where: { id },
         include: [
            {
               model: ProjectTimelineComment,
               include: [
                  {
                     model: User,
                     attributes: ['id', 'name', 'imgUrl'],
                  },
               ],
            },
         ],
      })
      res.json({
         success: true,
         message: '타임라인 게시물 조회 성공',
         timeline,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '타임라인 게시물을 호출하는 중에 오류가 발생했습니다.' })
   }
})

// 타임라인 댓글 작성
router.post('/timeline/comment/reg', isLoggedIn, async (req, res) => {
   try {
      const uid = req.user.id
      const tid = req.body.id
      const comment = req.body.comment
      ProjectTimelineComment.create({
         userId: uid,
         timelineId: tid,
         comment,
      })
      res.status(201).json({
         success: true,
         message: '댓글이 성공적으로 등록되었습니다.',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '댓글을 등록하는 중에 오류가 발생했습니다.' })
   }
})

// 리뷰 목록 호출
router.get('/reviews/:id', async (req, res) => {
   try {
      const { id } = req.params
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 5
      const offset = (page - 1) * limit

      let userId = 0
      if (req.user) userId = req.user.id

      const reviewCount = await ProjectReview.findOne({
         attributes: [
            [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
            [Sequelize.fn('AVG', Sequelize.col('star')), 'avg'],
         ],
         where: { projectId: id },
      })

      const reviews = await ProjectReview.findAll({
         limit,
         offset,
         where: { projectId: id },
         include: [
            {
               model: User,
               as: 'DirectReviews',
               attributes: ['name', 'imgUrl'],
            },
            {
               model: User,
               attributes: ['id'],
               through: { attributes: [] },
               as: 'ReviewsRecommends',
            },
         ],
         attributes: {
            include: [
               // 추천 수 계산
               [Sequelize.literal(`(SELECT COUNT(*) FROM ProjectReviewRecommend WHERE ProjectReviewRecommend.reviewId = ProjectReview.id)`), 'recommendCount'],
               // 사용자가 추천했는지 여부 확인
               [Sequelize.literal(`(SELECT COUNT(*) FROM ProjectReviewRecommend WHERE ProjectReviewRecommend.reviewId = ProjectReview.id AND ProjectReviewRecommend.userId = ${userId})`), 'isRecommended'],
            ],
         },
         order: [[Sequelize.literal(`(SELECT COUNT(*) FROM ProjectReviewRecommend WHERE ProjectReviewRecommend.reviewId = ProjectReview.id)`), 'DESC']],
      })

      res.json({
         success: true,
         message: '타임라인 목록 조회 성공',
         reviews,
         reviewCount,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '리뷰 목록 호출에 실패했습니다.' })
   }
})

// 추천
router.post('/review/recommend/reg/:id', async (req, res) => {
   try {
      const userId = req.user.id
      const reviewId = req.params.id

      const user = await User.findByPk(userId)
      const review = await ProjectReview.findByPk(reviewId)

      await user.addReviewsRecommend(review)

      res.json({
         success: true,
         message: '리뷰 추천 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '리뷰를 추천하는데 문제가 발생했습니다.' })
   }
})

// 추천 취소
router.delete('/review/recommend/del/:id', async (req, res) => {
   try {
      const userId = req.user.id
      const reviewId = req.params.id

      const user = await User.findByPk(userId)
      const review = await ProjectReview.findByPk(reviewId)

      await user.removeReviewsRecommend(review)

      res.json({
         success: true,
         message: '리뷰 추천 취소 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '리뷰의 추천을 취소하는데 문제가 발생했습니다.' })
   }
})

module.exports = router
