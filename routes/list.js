const express = require('express')
const router = express.Router()
const fs = require('fs')

const { Project, Order, Studio, User } = require('../models')
const { Sequelize } = require('sequelize')

// uploads 폴더가 없을 경우 새로 생성
try {
   fs.readdirSync('uploads')
} catch (err) {
   console.log('uploads 폴더를 새로 생성합니다')
   fs.mkdirSync('uploads')
}

// 프로젝트 정렬 호출
router.get('/:type', async (req, res) => {
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 4
      const offset = (page - 1) * limit
      const searchTerm = req.query.searchTerm || '' // 검색 키워드
      const categoryId = req.query.categoryId || '' // 카테고리 키워드
      const { type } = req.params // hot, new, end, comming, all
      const today = new Date()
      // 검색 조건절
      const whereClause = {
         ...(searchTerm && {
            ['title']: {
               [Sequelize.Op.like]: `%${searchTerm}%`,
            },
         }),
         ...(categoryId && {
            ['categoryId']: categoryId,
         }),
      }

      // 갯수 카운트
      let count = 0
      if (type === 'comming') {
         count = await Project.count({
            where: {
               startDate: {
                  [Sequelize.Op.gte]: today, // 오늘 이후의 데이터
               },
               proposalStatus: 'COMPLETE',
               projectStatus: 'WAITING_FUNDING',
            },
         })
      } else {
         count = await Project.count({
            where: {
               ...whereClause,
               projectStatus: 'ON_FUNDING',
            },
         })
      }
      const projects = {}

      // 인기 프로젝트
      if (type == 'hot' || type == 'all') {
         const tempProject = await Project.findAll({
            limit,
            offset,
            subQuery: false,
            include: [
               {
                  model: Order,
                  attributes: [],
                  required: false,
               },
               {
                  model: Studio,
               },
            ],
            where: {
               projectStatus: 'ON_FUNDING',
            },
            attributes: {
               include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']], // orderPrice 합계 계산
            },
            group: ['Project.id'],
            order: [['totalOrderPrice', 'DESC']],
         })
         projects.hot = tempProject
      }

      // 신규 프로젝트
      if (type == 'new' || type == 'all') {
         const tempProject = await Project.findAll({
            limit,
            offset,
            subQuery: false,
            include: [
               {
                  model: Order,
                  attributes: [],
                  required: false,
               },
               {
                  model: Studio,
               },
            ],
            where: {
               ...whereClause,
               projectStatus: 'ON_FUNDING',
            },
            attributes: {
               include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']], // orderPrice 합계 계산
            },
            group: ['Project.id'],
            order: [['startDate', 'DESC']],
         })
         projects.new = tempProject
      }

      // 마감 임박
      if (type == 'end' || type == 'all') {
         const tempProject = await Project.findAll({
            limit,
            offset,
            subQuery: false,
            include: [
               {
                  model: Order,
                  attributes: [],
                  required: false,
               },
               {
                  model: Studio,
               },
            ],
            where: {
               projectStatus: 'ON_FUNDING',
            },
            attributes: {
               include: [[Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice']], // orderPrice 합계 계산
            },
            group: ['Project.id'],
            order: [['endDate', 'ASC']],
         })
         projects.end = tempProject
      }

      // 공개 예정
      if (type == 'comming' || type == 'all') {
         const tempProject = await Project.findAll({
            limit,
            offset,
            subQuery: false,
            attributes: {
               include: [[Sequelize.fn('COUNT', Sequelize.col('Users.id')), 'userCount']],
            },
            include: [
               {
                  model: Studio,
               },
               {
                  model: User,
                  attributes: [],
                  through: {
                     attributes: [],
                  },
               },
            ],
            group: ['Project.id'],
            where: {
               startDate: {
                  [Sequelize.Op.gte]: today, // 오늘 이후의 데이터
               },
               proposalStatus: 'COMPLETE',
               projectStatus: 'WAITING_FUNDING',
            },
            order: [['startDate', 'ASC']],
         })
         projects.comming = tempProject
      }

      res.json({
         success: true,
         message: '프로젝트 목록 조회 성공',
         projects,
         count,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '프로젝트를 호출하는 중에 오류가 발생했습니다.' })
   }
})

router.get('/follow/:id', async (req, res) => {
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 8
      const offset = (page - 1) * limit
      const { id } = req.params

      let count = await Studio.count({
         include: {
            model: User,
            where: { id },
            through: { attributes: [] },
         },
      })

      const followUser = await User.findOne({
         subQuery: false,
         limit,
         offset,
         where: { id },
         attributes: [],
         include: [
            {
               model: Studio,
               through: { attributes: [] },
               attributes: {
                  include: [[Sequelize.fn('COUNT', Sequelize.col('Studios->StudioFavorite.userId')), 'userCount']],
               },
               include: [
                  {
                     model: User,
                     attributes: [],
                     through: { attributes: [] },
                     required: false,
                  },
               ],
            },
         ],
         group: ['Studios.id'],
      })
      res.json({
         followUser,
         count,
         success: true,
         message: '팔로우 목록 조회 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '구독중인 스튜디오를 호출하는 중에 오류가 발생했습니다.' })
   }
})

module.exports = router
