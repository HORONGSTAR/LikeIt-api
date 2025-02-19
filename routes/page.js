const express = require('express')
const router = express.Router()
const { isLoggedIn } = require('./middlewares')
const fs = require('fs')
const multer = require('multer')
const path = require('path')
const { User } = require('../models')

try {
   fs.readdirSync('uploads') //해당 폴더가 있는 지 확인
} catch (error) {
   console.log('uploads 폴더가 없어 uploads 폴더를 생성합니다.')
   fs.mkdirSync('uploads')
}

//
const upload = multer({
   storage: multer.diskStorage({
      destination(req, file, cb) {
         cb(null, 'uploads/userImg') //uploads 폴더에 저장
      },
      filename(req, file, cb) {
         const decodedFileName = decodeURIComponent(file.originalname) //파일명 디코딩(한글 파일명 깨짐 방지)
         const ext = path.extname(decodedFileName) //확장자 추출
         const basename = path.basename(decodedFileName, ext)
         cb(null, basename + Date.now() + ext)
      },
   }),
   limits: { fileSize: 5 * 1024 * 1024 },
})

//프로필 조회 localhost:8000/page/profile
router.get('/profile', isLoggedIn, async (req, res) => {
   res.json({
      success: true,
      user: req.user,
      message: '프로필 정보를 성공적으로 가져왔습니다.',
   })
})

//프로필 수정 (프로필 이미지랑 닉네임)
router.put('/profile', isLoggedIn, upload.single('img'), async (req, res) => {
   try {
      console.log('파일정보:', req.file)
      console.log('req.body:', req.body)

      if (!req.file) {
         return res.status(400).json({ success: false, message: '파일 업로드에 실패했습니다.' })
      }

      //게시물 생성
      const user = await User.findOne({ where: { id: req.user.id } })

      await user.update({
         name: req.body.name,
         imgUrl: req.file ? `/${req.file.filename}` : user.imgUrl,
      })

      res.json({ success: true })
   } catch (error) {
      console.error(error)
      res.status(500).json({ success: false, message: '프로필 수정 중 오류가 발생했습니다.', error })
   }
})

module.exports = router
