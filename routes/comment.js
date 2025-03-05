const express = require('express')
const router = express.Router()
const { StudioCommunityComment, User } = require('../models')
const { isLoggedIn } = require('./middlewares')

// 댓글 생성
router.post('/:id', isLoggedIn, async (req, res) => {
   try {
      await StudioCommunityComment.create({
         comment: req.body.comment,
         communityId: req.params.id,
         userId: req.user.id,
      })

      res.json({
         success: true,
         message: '댓글이 성공적으로 등록되었습니다.',
      })
   } catch (error) {
      console.error('댓글 생성 중 오류:', error)
      res.status(500).json({ success: false, message: '댓글 생성 중 오류가 발생했습니다.' })
   }
})

router.get('/:id', async (req, res) => {
   try {
      const communityId = req.params.id
      const { page, limit } = req.query

      if (!communityId) {
         return res.status(400).json({ success: false, message: '게시물 ID가 필요합니다.' })
      }

      const offset = (page - 1) * limit

      const { count, rows } = await StudioCommunityComment.findAndCountAll({
         where: { communityId },
         include: [
            {
               model: User,
               attributes: ['name', 'imgUrl'],
            },
         ],
         limit: parseInt(limit, 10),
         offset: parseInt(offset, 10),
         order: [['createdAt', 'DESC']],
      })

      res.json({
         success: true,
         comments: rows,
         pagination: {
            total: count,
            page: parseInt(page, 10),
            totalPages: Math.ceil(count / limit),
            limit: parseInt(limit, 10),
         },
         message: '댓글을 성공적으로 불러왔습니다.',
      })
   } catch (error) {
      console.error('댓글 불러오기 중 오류:', error)
      res.status(500).json({ success: false, message: '댓글 불러오기 중 오류가 발생했습니다.' })
   }
})

// 댓글 수정
router.put('/:id', isLoggedIn, async (req, res) => {
   try {
      const comment = req.body.comment

      const existingComment = await StudioCommunityComment.findOne({
         where: { id: req.params.id },
      })

      if (!existingComment) return res.status(404).json({ success: false, message: '댓글을 찾을 수 없거나 권한이 없습니다.' })

      await existingComment.update({ comment })

      res.json({
         success: true,
         message: '댓글이 성공적으로 수정되었습니다.',
      })
   } catch (error) {
      console.error('댓글 수정 중 오류:', error)
      res.status(500).json({ success: false, message: '댓글 수정 중 오류가 발생했습니다.' })
   }
})

// 댓글 삭제
router.delete('/:id', isLoggedIn, async (req, res) => {
   try {
      const existingComment = await StudioCommunityComment.findOne({
         where: { id: req.params.id },
      })

      if (!existingComment) {
         return res.status(404).json({ success: false, message: '댓글을 찾을 수 없거나 권한이 없습니다.' })
      }

      await existingComment.destroy()

      res.json({
         success: true,
         message: '댓글이 성공적으로 삭제되었습니다.',
      })
   } catch (error) {
      console.error('댓글 삭제 중 오류:', error)
      res.status(500).json({ success: false, message: '댓글 삭제 중 오류가 발생했습니다.' })
   }
})

module.exports = router
