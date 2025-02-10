const express = require('express')
const { Project } = require('../models') // Sequelize 모델 가져오기

const router = express.Router()

// ✅ 프로젝트 목록 조회 API 수정
router.get('/projects/list/:type', async (req, res) => {
   try {
      const { type } = req.params
      const { limit = 10, page = 1 } = req.query

      const offset = (page - 1) * limit
      const projects = await Project.findAll({
         where: { projectStatus: type }, // ✅ `projectStatus` 컬럼과 매칭
         limit: parseInt(limit, 10),
         offset: parseInt(offset, 10),
         order: [['createdAt', 'DESC']], // 최신순 정렬
      })

      res.json({ success: true, projects })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '프로젝트 목록 불러오기 실패' })
   }
})

module.exports = router
