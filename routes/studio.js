const express = require('express')
const router = express.Router()
const fs = require('fs')
const { Project, Studio, User } = require('../models')

router.get('/', async (req, res) => {
   try {
      const studio = await Studio.findOne({
         where: { id: 1 },
         include: [
            {
               model: Project,
               attributes: ['id', 'title', 'intro', 'imgUrl', 'projectStatus'],
               order: [['startDate', 'DESC']],
            },
         ],
      })
      res.json({
         success: true,
         message: '스튜디오 조회 성공',
         studio,
      })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '스튜디오를 호출하는 중에 오류가 발생했습니다.' })
   }
})

module.exports = router
