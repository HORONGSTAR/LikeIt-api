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

// 프로젝트 정렬 호출 (페이징+검색(구현중))
router.get('/:type', async (req, res) => {
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 4
      const offset = (page - 1) * limit

      const { type } = req.params // hot, new, end, comming, all
      console.log(type)

      let count = 0

      if (type === 'comming') {
         count = await Project.count({
            where: {
               startDate: {
                  [Sequelize.Op.gte]: today, // 오늘 이후의 데이터
               },
               proposalStatus: 'COMPLETE',
            },
         })
      } else {
         count = await Project.count({
            where: {
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
         const today = new Date()
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
               startDate: {
                  [Sequelize.Op.lte]: today, // 오늘 이전의 데이터
               },
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
         const today = new Date()
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
               startDate: {
                  [Sequelize.Op.lte]: today, // 오늘 이후의 데이터
               },
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
         const today = new Date()

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

module.exports = router
