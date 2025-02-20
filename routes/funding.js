const express = require('express')
const { Studio, Project, User, Order, Reward, RewardProduct, ProjectBudget, ProjectTimeline, ProjectTimelineComment } = require('../models')
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
      const count = await ProjectTimeline.count({
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
         count,
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

module.exports = router
