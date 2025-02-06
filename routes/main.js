const express = require('express')
const router = express.Router()
const fs = require('fs')

const { BannerProject, Project, Order } = require('../models')
const { Sequelize } = require('sequelize')

// uploads 폴더가 없을 경우 새로 생성
try {
   fs.readdirSync('uploads')
} catch (err) {
   console.log('uploads 폴더를 새로 생성합니다')
   fs.mkdirSync('uploads')
}

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

// 프로젝트 정렬 호출 (페이징+검색(구현중))
router.get('/list/:type', async (req, res) => {
   try {
      const page = parseInt(req.query.page, 10) || 1
      const limit = parseInt(req.query.limit, 10) || 4
      const offset = (page - 1) * limit

      const { type } = req.params // hot, new, end, comming, all

      const count = await Project.count()

      const projects = []

      // 인기 프로젝트
      if (type == 'hot' || type == 'all') {
         const tempProject = await Project.findAll({
            limit,
            offset,
            include: [
               {
                  model: Order,
                  attributes: [],
                  required: false,
               },
            ],
            attributes: [
               'id', // Project 모델에서 필요한 속성
               [Sequelize.fn('SUM', Sequelize.col('Orders.orderPrice')), 'totalOrderPrice'], // orderPrice 합계 계산
            ],
            group: ['Project.id'],
         })
         projects.push(tempProject)
      }

      // 신규 프로젝트
      if (type == 'new' || type == 'all') {
         const today = new Date()
         const tempProject = await Project.findAll({
            limit,
            offset,
            where: {
               startDate: {
                  [Sequelize.Op.lte]: today, // 오늘 이전의 데이터
               },
            },
            order: [['startDate', 'DESC']],
         })
         projects.push(tempProject)
      }

      // 마감 임박
      if (type == 'end' || type == 'all') {
         const today = new Date()
         const tempProject = await Project.findAll({
            limit,
            offset,
            where: {
               startDate: {
                  [Sequelize.Op.lte]: today, // 오늘 이후의 데이터
               },
            },
            order: [['endDate', 'ASC']],
         })
         projects.push(tempProject)
      }

      // 공개 예정
      if (type == 'comming' || type == 'all') {
         const today = new Date()

         const tempProject = await Project.findAll({
            limit,
            offset,
            where: {
               startDate: {
                  [Sequelize.Op.gte]: today, // 오늘 이후의 데이터
               },
               proposalStatus: 'COMPLETE',
            },
            order: [['startDate', 'ASC']],
         })
         projects.push(tempProject)
      }

      res.json({
         success: true,
         message: '프로젝트 목록 조회 성공',
         projects,
         pagination: {
            totalProjects: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            limit,
         },
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '프로젝트를 호출하는 중에 오류가 발생했습니다.' })
   }
})

module.exports = router
