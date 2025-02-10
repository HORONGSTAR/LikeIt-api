const express = require('express')
const router = express.Router()

const { BannerProject } = require('../models')
const { Sequelize, Model } = require('sequelize')

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

module.exports = router
