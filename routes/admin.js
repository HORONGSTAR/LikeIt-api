const express = require('express')
const router = express.Router()

const { Project } = require('../models')

// 관리자용 목록 호출
router.get('/', async (req, res) => {
   try {
      const count = await Project.count({})
      const projects = await Project.findAll({
         order: [['UpdatedAt', 'DESC']],
      })
      res.json({
         success: true,
         projects,
         count,
         message: '관리자용 목록 호출 성공',
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '관리자용 목록을 호출하는데 문제가 발생했습니다.' })
   }
})

module.exports = router
