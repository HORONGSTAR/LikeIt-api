const express = require('express')
const router = express.Router()
const fs = require('fs')

const { BannerProject, Project, Reward, Order } = require('../models')
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

// 프로젝트 호출
router.get('/list/:type', async (req, res) => {
   try {
      const { type } = req.params // hot, new, end, comming
      const whereClause = {}
      const orderClause = {}

      const projects = await Project.findAll({
         include: [
            {
               model: Reward,
               include: [{ model: Order }],
            },
         ],
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '프로젝트를 호출하는 중에 오류가 발생했습니다.' })
   }
})

module.exports = router
