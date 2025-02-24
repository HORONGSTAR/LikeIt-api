const express = require('express')
const router = express.Router()
const { User, Creator, StudioCreator } = require('../models')

// 창작자 목록 조회
router.get('/:studioId', async (req, res) => {
   try {
      const { studioId } = req.params

      const creators = await StudioCreator.findAll({
         where: { studioId },
         include: [
            {
               model: Creator,
               include: [
                  {
                     model: User,
                     attributes: ['id', 'email', 'phone', 'imgUrl', 'name'],
                  },
               ],
            },
         ],
         attributes: ['id', 'role', 'communityAdmin', 'spaceAdmin'],
      })
      res.json({ success: true, creators })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류', error })
   }
})

// 창작자 권한 업데이트
router.put('/:id', async (req, res) => {
   try {
      const { id } = req.params
      const { role, communityAdmin, spaceAdmin } = req.body

      const creator = await StudioCreator.findOne({ where: { id } })
      if (!creator) {
         return res.status(404).json({ success: false, message: '창작자를 찾을 수 없습니다.' })
      }

      await creator.update({ role, communityAdmin, spaceAdmin })
      res.json({ success: true, creator, message: '권한이 업데이트되었습니다.' })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '서버 오류', error })
   }
})

// 창작자 추가
router.post('/', async (req, res) => {
   try {
      const { name, role, studioId } = req.body

      const user = await User.findOne({ where: { name } })
      if (!user) {
         return res.status(404).json({ success: false, message: '해당 이름을 가진 유저가 존재하지 않습니다.' })
      }
      console.log('찾은 userId:', user.id)

      const creator = await Creator.findOne({ where: { userId: user.id } })
      if (!creator) {
         return res.status(404).json({ success: false, message: '해당 유저는 창작자로 등록되지 않았습니다.' })
      }
      console.log('찾은 creatorId:', creator.id)

      const existingCreator = await StudioCreator.findOne({ where: { creatorId: creator.id, studioId } })
      if (existingCreator) {
         return res.status(400).json({ success: false, message: '이미 등록된 창작자입니다.' })
      }

      const newStudioCreator = await StudioCreator.create({
         creatorId: creator.id,
         role: role || 'TEAMMATE',
         studioId,
         communityAdmin: 'N',
         spaceAdmin: 'N',
      })

      res.json({ success: true, studioCreator: newStudioCreator, message: '창작자가 studioCreators 테이블에 추가되었습니다.' })
   } catch (error) {
      console.error('창작자 추가 실패:', error)
      res.status(500).json({ success: false, message: '서버 오류', error })
   }
})

// 창작자 삭제
router.delete('/:id', async (req, res) => {
   try {
      const { id } = req.params

      const creator = await StudioCreator.findOne({ where: { id } })
      if (!creator) {
         return res.status(404).json({ success: false, message: '해당 창작자를 찾을 수 없습니다.' })
      }

      await creator.destroy()

      res.json({ success: true, message: '창작자가 스튜디오에서 삭제되었습니다.' })
   } catch (error) {
      console.error('창작자 삭제 실패:', error)
      res.status(500).json({ success: false, message: '서버 오류', error })
   }
})

module.exports = router
