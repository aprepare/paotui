<template>
  <div v-loading="loading">
    <h2>页面配置</h2>
    <el-tabs v-model="activeTab" @tab-change="onTabChange">
      <!-- ===== 首页配置 ===== -->
      <el-tab-pane label="首页配置" name="home">
        <div style="margin:12px 0;display:flex;gap:10px;align-items:center">
          <el-button type="success" :disabled="!homeLoaded" @click="saveHome">保存首页配置</el-button>
          <el-tag v-if="homeFromDb" type="success">已从数据库加载</el-tag>
          <el-tag v-else-if="homeLoaded" type="warning">数据库无配置（使用代码默认值，小程序端正常显示）</el-tag>
          <el-tag v-else type="danger">加载失败，禁止保存</el-tag>
          <el-button v-if="homeLoaded && homeActions.length === 0 && homeBanners.length === 0 && !heroImage" size="small" @click="fillHomeDefaults">填充默认值</el-button>
        </div>

        <!-- 顶部形象图 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">顶部形象图（heroImage）</span>
              <span style="font-size:12px;color:#999">对应首页蓝色卡片右侧的形象图</span>
            </div>
          </template>
          <div style="display:flex;gap:20px;align-items:center">
            <div>
              <ImgPreview :url="heroImage" wide />
            </div>
            <div style="flex:1">
              <el-form label-width="80px" size="small">
                <el-form-item label="图片">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => uploadImg(f, url => heroImage.value = url)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="heroImage" placeholder="图片路径（/static/... 或 /uploads/...）" />
                  </div>
                </el-form-item>
              </el-form>
            </div>
          </div>
        </el-card>

        <!-- 快捷操作 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">快捷操作（actions）</span>
              <el-button size="small" @click="homeActions.push({ emoji: '', iconUrl: '', text: '', link: '', bg: '' })">添加操作</el-button>
            </div>
          </template>
          <el-empty v-if="homeActions.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(act, i) in homeActions" :key="i" shadow="hover" style="width:300px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">操作 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="homeActions.splice(i, 1)">删除</el-button>
              </div>
              <div style="text-align:center;margin-bottom:10px">
                <ImgPreview :url="act.iconUrl" :emoji="act.emoji" />
              </div>
              <el-form label-width="60px" size="small">
                <el-form-item label="图标">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => uploadImg(f, url => act.iconUrl = url)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="act.iconUrl" placeholder="图片路径" />
                  </div>
                </el-form-item>
                <el-form-item label="Emoji"><el-input v-model="act.emoji" placeholder="如 📦" /></el-form-item>
                <el-form-item label="文字"><el-input v-model="act.text" /></el-form-item>
                <el-form-item label="跳转"><el-input v-model="act.link" placeholder="/pages/xxx/xxx" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>

        <!-- 轮播图 -->
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">轮播图（banners）</span>
              <el-button size="small" @click="homeBanners.push({ imageUrl: '', emoji: '', title: '', desc: '', bg: '' })">添加轮播</el-button>
            </div>
          </template>
          <el-empty v-if="homeBanners.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(banner, i) in homeBanners" :key="i" shadow="hover" style="width:350px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">轮播 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="homeBanners.splice(i, 1)">删除</el-button>
              </div>
              <div style="margin-bottom:10px">
                <template v-if="banner.imageUrl">
                  <ImgPreview :url="banner.imageUrl" wide />
                </template>
                <div v-else :style="{ background: banner.bg || '#ccc', borderRadius: '8px', padding: '16px', minHeight: '60px', display: 'flex', alignItems: 'center', gap: '12px' }">
                  <span v-if="banner.emoji" style="font-size:36px">{{ banner.emoji }}</span>
                  <div>
                    <div style="color:#fff;font-weight:bold;font-size:14px">{{ banner.title || '标题' }}</div>
                    <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:4px">{{ banner.desc || '描述' }}</div>
                  </div>
                </div>
              </div>
              <el-form label-width="70px" size="small">
                <el-form-item label="轮播图片">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => uploadImg(f, url => banner.imageUrl = url)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="banner.imageUrl" placeholder="图片URL（可选）" />
                  </div>
                </el-form-item>
                <el-form-item label="Emoji"><el-input v-model="banner.emoji" placeholder="如 📦" /></el-form-item>
                <el-form-item label="标题"><el-input v-model="banner.title" /></el-form-item>
                <el-form-item label="描述"><el-input v-model="banner.desc" /></el-form-item>
                <el-form-item label="背景色"><el-input v-model="banner.bg" placeholder="linear-gradient(135deg, #4299E1, #2B6CB0)" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ===== 福利页配置 ===== -->
      <el-tab-pane label="福利页配置" name="welfare">
        <div style="margin:12px 0;display:flex;gap:10px;align-items:center">
          <el-button type="success" :disabled="!welfareLoaded" @click="saveWelfare">保存福利页配置</el-button>
          <el-tag v-if="welfareFromDb" type="success">已从数据库加载</el-tag>
          <el-tag v-else-if="welfareLoaded" type="warning">数据库无配置（使用代码默认值，小程序端正常显示）</el-tag>
          <el-tag v-else type="danger">加载失败，禁止保存</el-tag>
          <el-button v-if="welfareLoaded && welfareServices.length === 0 && welfareBanners.length === 0" size="small" @click="fillWelfareDefaults">填充默认值</el-button>
        </div>

        <!-- 服务入口 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">服务入口（services）</span>
              <el-button size="small" @click="welfareServices.push({ iconUrl: '', text: '', desc: '', url: '' })">添加服务</el-button>
            </div>
          </template>
          <el-empty v-if="welfareServices.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(svc, i) in welfareServices" :key="i" shadow="hover" style="width:300px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">服务 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="welfareServices.splice(i, 1)">删除</el-button>
              </div>
              <div style="text-align:center;margin-bottom:10px">
                <ImgPreview :url="svc.iconUrl" />
              </div>
              <el-form label-width="60px" size="small">
                <el-form-item label="图标">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => uploadImg(f, url => svc.iconUrl = url)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="svc.iconUrl" placeholder="图片路径" />
                  </div>
                </el-form-item>
                <el-form-item label="名称"><el-input v-model="svc.text" /></el-form-item>
                <el-form-item label="描述"><el-input v-model="svc.desc" /></el-form-item>
                <el-form-item label="跳转"><el-input v-model="svc.url" placeholder="/pages/xxx/index" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>

        <!-- 福利页轮播 -->
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">轮播图（banners）</span>
              <el-button size="small" @click="welfareBanners.push({ title: '', desc: '', bg: '', imageUrl: '' })">添加轮播</el-button>
            </div>
          </template>
          <el-empty v-if="welfareBanners.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(banner, i) in welfareBanners" :key="i" shadow="hover" style="width:350px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">轮播 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="welfareBanners.splice(i, 1)">删除</el-button>
              </div>
              <div style="margin-bottom:10px">
                <template v-if="banner.imageUrl">
                  <ImgPreview :url="banner.imageUrl" style="width:100%;height:100px" wide />
                </template>
                <div v-else :style="{ background: banner.bg || '#ccc', borderRadius: '8px', padding: '16px', minHeight: '60px' }">
                  <div style="color:#fff;font-weight:bold;font-size:14px">{{ banner.title || '标题' }}</div>
                  <div style="color:rgba(255,255,255,0.85);font-size:12px;margin-top:4px">{{ banner.desc || '描述' }}</div>
                </div>
              </div>
              <el-form label-width="70px" size="small">
                <el-form-item label="轮播图片">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => uploadImg(f, url => banner.imageUrl = url)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="banner.imageUrl" placeholder="图片URL（可选）" />
                  </div>
                </el-form-item>
                <el-form-item label="标题"><el-input v-model="banner.title" /></el-form-item>
                <el-form-item label="描述"><el-input v-model="banner.desc" /></el-form-item>
                <el-form-item label="背景色"><el-input v-model="banner.bg" placeholder="linear-gradient(...)" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>
      </el-tab-pane>

      <!-- ===== 兼职页配置 ===== -->
      <el-tab-pane label="兼职页配置" name="job">
        <div style="margin:12px 0;display:flex;gap:10px;align-items:center">
          <el-button type="success" :disabled="!jobLoaded" @click="saveJob">保存兼职页配置</el-button>
          <el-tag v-if="jobFromDb" type="success">已从数据库加载</el-tag>
          <el-tag v-else-if="jobLoaded" type="warning">数据库无配置（使用代码默认值）</el-tag>
          <el-tag v-else type="danger">加载失败，禁止保存</el-tag>
          <el-button v-if="jobLoaded && jobCategories.length === 0" size="small" @click="fillJobDefaults">填充默认值</el-button>
        </div>

        <!-- 分类入口 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">分类入口（categories）</span>
              <div style="display:flex;gap:8px;align-items:center">
                <span style="font-size:12px;color:#999">兼职页面的4个分类卡片</span>
                <el-button size="small" @click="jobCategories.push({ icon: '', iconUrl: '', title: '', desc: '', gradient: 'linear-gradient(135deg, #4299E1, #2B6CB0)', link: '' })">添加分类</el-button>
              </div>
            </div>
          </template>
          <el-empty v-if="jobCategories.length === 0" description="暂无配置项" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:16px">
            <el-card v-for="(cat, i) in jobCategories" :key="i" shadow="hover" style="width:320px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
                <span style="font-weight:bold">分类 {{ i + 1 }}</span>
                <el-button type="danger" size="small" text @click="jobCategories.splice(i, 1)">删除</el-button>
              </div>
              <div style="text-align:center;margin-bottom:10px">
                <ImgPreview :url="cat.iconUrl" :emoji="cat.icon" />
              </div>
              <el-form label-width="70px" size="small">
                <el-form-item label="图标图片">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => uploadImg(f, url => cat.iconUrl = url)">
                      <el-button size="small" type="primary">上传</el-button>
                    </el-upload>
                    <el-input v-model="cat.iconUrl" placeholder="图片路径（优先于emoji）" />
                  </div>
                </el-form-item>
                <el-form-item label="Emoji"><el-input v-model="cat.icon" placeholder="如 📚" /></el-form-item>
                <el-form-item label="标题"><el-input v-model="cat.title" placeholder="如 家教信息" /></el-form-item>
                <el-form-item label="描述"><el-input v-model="cat.desc" placeholder="如 一对一辅导" /></el-form-item>
                <el-form-item label="背景色"><el-input v-model="cat.gradient" placeholder="linear-gradient(135deg, #667eea, #764ba2)" /></el-form-item>
                <el-form-item label="跳转"><el-input v-model="cat.link" placeholder="/pages/job-sub/tutor" /></el-form-item>
              </el-form>
            </el-card>
          </div>
        </el-card>

        <!-- 寒暑假横幅 -->
        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">寒暑假横幅配置</span>
              <span style="font-size:12px;color:#999">兼职页面中间的橙色横幅</span>
            </div>
          </template>
          <el-form label-width="80px" size="small">
            <el-form-item label="图标">
              <el-input v-model="jobSeasonBanner.icon" placeholder="如 🌴" style="width:200px" />
            </el-form-item>
            <el-form-item label="标题">
              <el-input v-model="jobSeasonBanner.title" placeholder="如 寒暑假兼职" style="width:300px" />
            </el-form-item>
            <el-form-item label="描述">
              <el-input v-model="jobSeasonBanner.desc" placeholder="如 精选假期好岗位，安全有保障" style="width:400px" />
            </el-form-item>
            <el-form-item label="背景色">
              <el-input v-model="jobSeasonBanner.bg" placeholder="linear-gradient(135deg, #FF9800, #F57C00)" style="width:400px" />
            </el-form-item>
            <el-form-item label="跳转">
              <el-input v-model="jobSeasonBanner.link" placeholder="/pages/job-sub/seasonal" style="width:400px" />
            </el-form-item>
            <el-form-item label="横幅图片">
              <div style="display:flex;gap:6px;align-items:center">
                <el-upload :show-file-list="false" :auto-upload="false" accept="image/*" @change="f => uploadImg(f, url => jobSeasonBanner.imageUrl = url)">
                  <el-button size="small" type="primary">上传</el-button>
                </el-upload>
                <el-input v-model="jobSeasonBanner.imageUrl" placeholder="可选，上传后替代emoji+文字样式" style="width:350px" />
              </div>
              <div v-if="jobSeasonBanner.imageUrl" style="margin-top:8px">
                <ImgPreview :url="jobSeasonBanner.imageUrl" wide />
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 热门兼职提示 -->
        <el-card style="margin-top:20px">
          <template #header>
            <span style="font-weight:bold;font-size:16px">热门兼职</span>
          </template>
          <el-alert type="info" :closable="false">
            <template #title>热门兼职由「内容管理 → 兼职管理」中的 <b>热招开关</b> 控制。打开某个岗位的热招开关，它就会显示在兼职页面的热门兼职轮播中。</template>
          </el-alert>
        </el-card>
      </el-tab-pane>

      <!-- ===== 价格配置 ===== -->
      <el-tab-pane label="价格配置" name="price">
        <div style="margin:12px 0;display:flex;gap:10px;align-items:center">
          <el-button type="success" :disabled="!priceLoaded" @click="savePrice">保存价格配置</el-button>
          <el-tag v-if="priceFromDb" type="success">已从数据库加载</el-tag>
          <el-tag v-else-if="priceLoaded" type="warning">数据库无配置（使用代码默认值）</el-tag>
          <el-tag v-else type="danger">加载失败，禁止保存</el-tag>
        </div>

        <el-alert type="info" :closable="false" style="margin-bottom:16px">
          <template #title>将金额设为 <b>0</b> 即可免费。修改后小程序端实时生效（页面刷新即加载最新配置）。</template>
        </el-alert>

        <!-- 快递配送费 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <span style="font-weight:bold;font-size:16px">📦 快递配送费</span>
          </template>
          <el-form label-width="120px" size="default">
            <el-form-item label="小件配送费（元）">
              <el-input-number v-model="priceForm.expressSmallFee" :min="0" :step="0.5" :precision="2" />
              <span style="margin-left:8px;color:#999;font-size:12px">信件/小包裹，默认 2</span>
            </el-form-item>
            <el-form-item label="大件配送费（元）">
              <el-input-number v-model="priceForm.expressMediumFee" :min="0" :step="1" :precision="2" />
              <span style="margin-left:8px;color:#999;font-size:12px">中型包裹，默认 5</span>
            </el-form-item>
            <el-form-item label="超大件配送费（元）">
              <el-input-number v-model="priceForm.expressLargeFee" :min="0" :step="1" :precision="2" />
              <span style="margin-left:8px;color:#999;font-size:12px">大型/重型包裹，默认 20</span>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 查看联系方式费用 -->
        <el-card style="margin-bottom:20px">
          <template #header>
            <span style="font-weight:bold;font-size:16px">👁️ 查看联系方式费用</span>
          </template>
          <el-form label-width="180px" size="default">
            <el-form-item label="家教查看联系方式（元）">
              <el-input-number v-model="priceForm.tutorViewFee" :min="0" :step="0.01" :precision="2" />
              <span style="margin-left:8px;color:#999;font-size:12px">设为 0 = 免费查看，默认 0.01</span>
            </el-form-item>
            <el-form-item label="技能服务查看联系方式（元）">
              <el-input-number v-model="priceForm.skillViewFee" :min="0" :step="0.5" :precision="2" />
              <span style="margin-left:8px;color:#999;font-size:12px">设为 0 = 免费查看，默认 1</span>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 洗鞋跑腿费 -->
        <el-card>
          <template #header>
            <span style="font-weight:bold;font-size:16px">🧹 洗鞋服务</span>
          </template>
          <el-form label-width="140px" size="default">
            <el-form-item label="跑腿取送费（元）">
              <el-input-number v-model="priceForm.washDeliveryFee" :min="0" :step="1" :precision="2" />
              <span style="margin-left:8px;color:#999;font-size:12px">上门取送的附加费，默认 3</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- ===== 屏蔽词管理 ===== -->
      <el-tab-pane label="屏蔽词管理" name="bannedWords">
        <div style="margin:12px 0;display:flex;gap:10px;align-items:center">
          <el-button type="success" @click="saveBannedWords">保存屏蔽词</el-button>
          <el-tag type="info">共 {{ bannedWords.length }} 个屏蔽词</el-tag>
        </div>

        <el-alert type="info" :closable="false" style="margin-bottom:16px">
          <template #title>用户发帖、评论、发布商品等内容中如果包含屏蔽词，将被自动拦截。此检测在微信官方内容安全检测<b>之前</b>执行，命中即拦截。</template>
        </el-alert>

        <el-card style="margin-bottom:20px">
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">添加屏蔽词</span>
            </div>
          </template>
          <div style="display:flex;gap:10px;margin-bottom:16px">
            <el-input v-model="newBannedWord" placeholder="输入要屏蔽的词，如：兼职" @keyup.enter="addBannedWord" style="width:300px" />
            <el-button type="primary" @click="addBannedWord">添加</el-button>
          </div>
          <div style="margin-bottom:8px">
            <el-button size="small" @click="showBatchInput = !showBatchInput">{{ showBatchInput ? '收起批量添加' : '批量添加（每行一个）' }}</el-button>
          </div>
          <div v-if="showBatchInput">
            <el-input v-model="batchBannedWords" type="textarea" :rows="5" placeholder="每行一个屏蔽词" />
            <el-button type="primary" size="small" style="margin-top:8px" @click="addBatchBannedWords">批量添加</el-button>
          </div>
        </el-card>

        <el-card>
          <template #header>
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-weight:bold;font-size:16px">当前屏蔽词列表</span>
              <el-button type="danger" size="small" text @click="clearAllBannedWords" v-if="bannedWords.length > 0">清空全部</el-button>
            </div>
          </template>
          <el-empty v-if="bannedWords.length === 0" description="暂无屏蔽词，请在上方添加" />
          <div v-else style="display:flex;flex-wrap:wrap;gap:8px">
            <el-tag v-for="(word, i) in bannedWords" :key="i" closable size="large" @close="bannedWords.splice(i, 1)" style="font-size:14px">{{ word }}</el-tag>
          </div>
        </el-card>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted, h } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../api/index'

const ImgPreview = (props) => {
  const url = props.url
  const emoji = props.emoji
  if (url && isLocalStaticPath(url)) {
    const filename = url.split('/').pop()
    return h('div', {
      style: {
        width: props.wide ? '100%' : '60px', height: props.wide ? '100px' : '60px',
        background: '#e6f7ff', border: '1px dashed #91d5ff', borderRadius: '8px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        margin: props.wide ? '' : '0 auto', color: '#1890ff', fontSize: '11px', padding: '4px', textAlign: 'center'
      }
    }, [
      h('div', { style: { fontSize: '9px', color: '#999', marginBottom: '2px' } }, '小程序本地资源'),
      h('div', { style: { fontWeight: 'bold', wordBreak: 'break-all' } }, filename)
    ])
  }
  if (url) {
    const resolved = resolveUrl(url)
    return h('img', {
      src: resolved, style: {
        width: props.wide ? '100%' : '60px', height: props.wide ? '100px' : '60px',
        objectFit: props.wide ? 'cover' : 'contain', borderRadius: '8px', display: 'block',
        margin: props.wide ? '' : '0 auto'
      }
    })
  }
  if (emoji) return h('div', { style: { fontSize: '40px', lineHeight: '60px' } }, emoji)
  return h('div', {
    style: {
      width: '60px', height: '60px', background: '#f5f5f5', borderRadius: '8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#ccc', fontSize: '12px'
    }
  }, '无图标')
}
ImgPreview.props = ['url', 'emoji', 'wide']

const activeTab = ref('home')
const loading = ref(false)

const homeLoaded = ref(false)
const homeFromDb = ref(false)
const welfareLoaded = ref(false)
const welfareFromDb = ref(false)
const jobLoaded = ref(false)
const jobFromDb = ref(false)
const priceLoaded = ref(false)
const priceFromDb = ref(false)
const priceForm = ref({
  expressSmallFee: 2,
  expressMediumFee: 5,
  expressLargeFee: 20,
  tutorViewFee: 0.01,
  skillViewFee: 1,
  washDeliveryFee: 3
})

const heroImage = ref('/static/kuaidi.jpg')
const homeActions = ref([])
const homeBanners = ref([])
const welfareServices = ref([])
const welfareBanners = ref([])
const jobHeroImage = ref('')
const jobBanners = ref([])
const jobCategories = ref([])
const jobSeasonBanner = ref({ icon: '🌴', title: '寒暑假兼职', desc: '精选假期好岗位，安全有保障', bg: 'linear-gradient(135deg, #FF9800, #F57C00)', link: '/pages/job-sub/seasonal', imageUrl: '' })
const jobHotList = ref([])

const defaultJobCategories = [
  { icon: '📚', iconUrl: '', title: '家教信息', desc: '一对一辅导', gradient: 'linear-gradient(135deg, #667eea, #764ba2)', link: '/pages/job-sub/tutor' },
  { icon: '🏫', iconUrl: '', title: '校内兼职', desc: '图书馆/食堂', gradient: 'linear-gradient(135deg, #4299E1, #2B6CB0)', link: '/pages/job-sub/campus' },
  { icon: '🏖️', iconUrl: '', title: '阿那亚兼职', desc: '海边度假区', gradient: 'linear-gradient(135deg, #f093fb, #f5576c)', link: '/pages/job-sub/anaya' },
  { icon: '🏡', iconUrl: '', title: '阿尔卡迪亚兼职', desc: '社区服务', gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)', link: '/pages/job-sub/arcadia' }
]

function isLocalStaticPath(url) {
  return url && (url.startsWith('/static/') || url.startsWith('static/'))
}

function resolveUrl(url) {
  if (!url) return ''
  if (url.startsWith('http')) return url
  if (isLocalStaticPath(url)) return ''
  return window.location.origin + url
}

const defaultActions = [
  { emoji: '📦', iconUrl: '/static/action/kuaidi.png', text: '代取快递', link: '/pages/express/create', bg: '' },
  { emoji: '🏃', iconUrl: '/static/action/paotui.png', text: '万能跑腿', link: '/pages/errand/create', bg: '' },
  { emoji: '🏅', iconUrl: '/static/action/qishou.png', text: '骑手注册', link: '/pages/express/rider-register', bg: '' }
]
const defaultBanners = [
  { imageUrl: '', emoji: '📦', title: '快递代取 极速送达', desc: '下单后最快30分钟送到宿舍', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' },
  { imageUrl: '', emoji: '🏃', title: '万能跑腿 有求必应', desc: '买饭、打印、取件 一键搞定', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' },
  { imageUrl: '', emoji: '🎉', title: '新用户首单立减', desc: '注册即享优惠 快来体验吧', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }
]
const defaultWelfareServices = [
  { iconUrl: '/static/welfare/dazi.png', text: '校园搭子', desc: '找搭子一起', url: '/pages/team/index' },
  { iconUrl: '/static/welfare/xihu.png', text: '萌马洗护', desc: '洗鞋团购', url: '/pages/wash/index' },
  { iconUrl: '/static/welfare/pinche.png', text: '校园拼车', desc: '拼车省钱', url: '/pages/carpool/index' },
  { iconUrl: '/static/welfare/jineng.png', text: '技能出租', desc: '技能变现', url: '/pages/skill/index' },
  { iconUrl: '/static/welfare/kaoyan.png', text: '考研服务', desc: '考研加油', url: '/pages/graduate/index' },
  { iconUrl: '/static/welfare/ershou.png', text: '二手市场', desc: '闲置换钱', url: '/pages/market/index' },
  { iconUrl: '/static/welfare/bashi.png', text: '小岛巴士', desc: '校园出行', url: '/pages/carpool/index' },
  { iconUrl: '/static/welfare/waimai.png', text: '福利外卖', desc: '优惠点餐', url: '/pages/food/index' }
]
const defaultWelfareBanners = [
  { title: '新学期福利大放送', desc: '多重优惠等你来领', bg: 'linear-gradient(135deg, #F6AD55, #DD6B20)', imageUrl: '' },
  { title: '快递代取 首单立减', desc: '新用户专享优惠', bg: 'linear-gradient(135deg, #63B3ED, #2B6CB0)', imageUrl: '' },
  { title: '拼车出行 安全省钱', desc: '校园出行好帮手', bg: 'linear-gradient(135deg, #68D391, #38A169)', imageUrl: '' }
]

function fillHomeDefaults() {
  heroImage.value = '/static/kuaidi.jpg'
  homeActions.value = defaultActions.map(a => ({ ...a }))
  homeBanners.value = defaultBanners.map(b => ({ ...b }))
}
function fillWelfareDefaults() {
  welfareServices.value = defaultWelfareServices.map(s => ({ ...s }))
  welfareBanners.value = defaultWelfareBanners.map(b => ({ ...b }))
}

async function loadHome() {
  loading.value = true
  homeLoaded.value = false
  homeFromDb.value = false
  try {
    const { data } = await api.get('/admin/home-config')
    if (data.code === 0) {
      const cfg = data.data?.config || {}
      if (cfg.heroImage) {
        heroImage.value = cfg.heroImage
      } else {
        heroImage.value = '/static/kuaidi.jpg'
      }
      const hasActions = Array.isArray(cfg.actions) && cfg.actions.length > 0
      const hasBanners = Array.isArray(cfg.banners) && cfg.banners.length > 0

      if (hasActions || hasBanners) {
        // 已有数据库配置
        homeFromDb.value = true
        // 如果数据库里还没有 actions，就用默认 3 个快捷操作，方便直接修改
        homeActions.value = hasActions ? cfg.actions.map(a => ({ ...a })) : defaultActions.map(a => ({ ...a }))
        homeBanners.value = hasBanners ? cfg.banners.map(b => ({ ...b })) : []
      } else {
        // 数据库暂无配置，默认展示代码里的默认值，方便直接修改
        homeFromDb.value = false
        fillHomeDefaults()
      }
      homeLoaded.value = true
    }
  } catch (e) {
    ElMessage.error('加载首页配置失败')
  }
  loading.value = false
}

async function loadWelfare() {
  loading.value = true
  welfareLoaded.value = false
  welfareFromDb.value = false
  try {
    const { data } = await api.get('/admin/welfare-config')
    if (data.code === 0) {
      const cfg = data.data?.config || {}
      const hasServices = Array.isArray(cfg.services) && cfg.services.length > 0
      const hasBanners = Array.isArray(cfg.banners) && cfg.banners.length > 0

      if (hasServices || hasBanners) {
        // 已有数据库配置
        welfareFromDb.value = true
        welfareServices.value = hasServices ? cfg.services.map(s => ({ ...s })) : []
        welfareBanners.value = hasBanners ? cfg.banners.map(b => ({ ...b })) : []
      } else {
        // 数据库暂无配置，默认展示代码里的默认值，方便直接修改
        welfareFromDb.value = false
        fillWelfareDefaults()
      }
      welfareLoaded.value = true
    }
  } catch (e) {
    ElMessage.error('加载福利页配置失败')
  }
  loading.value = false
}

function onTabChange(tab) {
  if (tab === 'home') loadHome()
  else if (tab === 'welfare') loadWelfare()
  else if (tab === 'job') loadJob()
  else if (tab === 'price') loadPrice()
  else if (tab === 'bannedWords') loadBannedWords()
}

async function loadJob() {
  loading.value = true
  jobLoaded.value = false
  jobFromDb.value = false
  try {
    const { data } = await api.get('/admin/job-config')
    if (data.code === 0) {
      const cfg = data.data?.config || {}
      if (Array.isArray(cfg.categories) && cfg.categories.length > 0) {
        jobFromDb.value = true
        jobCategories.value = cfg.categories.map(c => ({ ...c }))
      } else {
        jobFromDb.value = false
        jobCategories.value = defaultJobCategories.map(c => ({ ...c }))
      }
      if (cfg.seasonBanner) {
        jobSeasonBanner.value = { ...cfg.seasonBanner }
        if (!jobFromDb.value) jobFromDb.value = true
      }
      if (Array.isArray(cfg.hotJobs) && cfg.hotJobs.length > 0) {
        jobHotList.value = cfg.hotJobs.map(j => ({ ...j }))
        if (!jobFromDb.value) jobFromDb.value = true
      } else {
        jobHotList.value = []
      }
      jobLoaded.value = true
    }
  } catch (e) {
    ElMessage.error('加载兼职页配置失败')
  }
  loading.value = false
}

function fillJobDefaults() {
  jobCategories.value = defaultJobCategories.map(c => ({ ...c }))
  jobSeasonBanner.value = { icon: '🌴', title: '寒暑假兼职', desc: '精选假期好岗位，安全有保障', bg: 'linear-gradient(135deg, #FF9800, #F57C00)', link: '/pages/job-sub/seasonal', imageUrl: '' }
  jobHotList.value = []
}

async function saveJob() {
  if (!jobLoaded.value) return ElMessage.error('配置未成功加载，禁止保存')
  try {
    await ElMessageBox.confirm(
      '保存后将覆盖数据库中的兼职页配置，小程序端将实时生效。\n请确认页面上显示的内容是你想要的。',
      '确认保存', { type: 'warning' }
    )
  } catch { return }
  try {
    await api.put('/admin/job-config', {
      config: { categories: jobCategories.value, seasonBanner: jobSeasonBanner.value, hotJobs: jobHotList.value }
    })
    jobFromDb.value = true
    ElMessage.success('兼职页配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

async function loadPrice() {
  loading.value = true
  priceLoaded.value = false
  priceFromDb.value = false
  try {
    const { data } = await api.get('/admin/price-config')
    if (data.code === 0) {
      const cfg = data.data?.config || {}
      if (Object.keys(cfg).length > 0) {
        priceFromDb.value = true
        priceForm.value = {
          expressSmallFee: cfg.expressSmallFee ?? 2,
          expressMediumFee: cfg.expressMediumFee ?? 5,
          expressLargeFee: cfg.expressLargeFee ?? 20,
          tutorViewFee: cfg.tutorViewFee ?? 0.01,
          skillViewFee: cfg.skillViewFee ?? 1,
          washDeliveryFee: cfg.washDeliveryFee ?? 3
        }
      }
      priceLoaded.value = true
    }
  } catch (e) {
    ElMessage.error('加载价格配置失败')
  }
  loading.value = false
}

async function savePrice() {
  if (!priceLoaded.value) return ElMessage.error('配置未成功加载，禁止保存')
  try {
    await ElMessageBox.confirm(
      '保存后小程序端将实时生效（页面刷新后）。\n请确认价格配置正确。',
      '确认保存', { type: 'warning' }
    )
  } catch { return }
  try {
    await api.put('/admin/price-config', { config: priceForm.value })
    priceFromDb.value = true
    ElMessage.success('价格配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

async function saveHome() {
  if (!homeLoaded.value) return ElMessage.error('配置未成功加载，禁止保存')
  try {
    await ElMessageBox.confirm(
      '保存后将覆盖数据库中的首页配置，小程序端将实时生效。\n请确认页面上显示的内容是你想要的。',
      '确认保存', { type: 'warning' }
    )
  } catch { return }
  try {
    await api.put('/admin/home-config', {
      config: { heroImage: heroImage.value, banners: homeBanners.value, actions: homeActions.value }
    })
    homeFromDb.value = true
    ElMessage.success('首页配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

async function saveWelfare() {
  if (!welfareLoaded.value) return ElMessage.error('配置未成功加载，禁止保存')
  try {
    await ElMessageBox.confirm(
      '保存后将覆盖数据库中的福利页配置，小程序端将实时生效。\n请确认页面上显示的内容是你想要的。',
      '确认保存', { type: 'warning' }
    )
  } catch { return }
  try {
    await api.put('/admin/welfare-config', {
      config: { services: welfareServices.value, banners: welfareBanners.value }
    })
    welfareFromDb.value = true
    ElMessage.success('福利页配置已保存')
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

async function uploadImg(uploadFile, callback) {
  const file = uploadFile.raw || uploadFile
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const { data } = await api.post('/admin/upload?folder=config', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (data.code === 0) {
      // 后端已返回成功，这里即使后续赋值出错，也不要再误报「上传失败」
      try {
        if (callback && data.data && data.data.url) {
          callback(data.data.url)
        }
      } catch (err) {
        console.error('[uploadImg] set url error:', err)
      }
      ElMessage.success('图片上传成功')
    } else {
      ElMessage.error(data.msg || '上传失败')
    }
  } catch (e) {
    console.error('[uploadImg] request error:', e)
    ElMessage.error('上传失败')
  }
}

// ===== 屏蔽词相关 =====
const bannedWords = ref([])
const newBannedWord = ref('')
const batchBannedWords = ref('')
const showBatchInput = ref(false)

async function loadBannedWords() {
  loading.value = true
  try {
    const { data } = await api.get('/admin/banned-words')
    if (data.code === 0) {
      bannedWords.value = data.data?.words || []
    }
  } catch (e) {
    ElMessage.error('加载屏蔽词失败')
  }
  loading.value = false
}

function addBannedWord() {
  const word = (newBannedWord.value || '').trim()
  if (!word) return ElMessage.warning('请输入屏蔽词')
  if (bannedWords.value.includes(word)) return ElMessage.warning('"' + word + '" 已存在')
  bannedWords.value.push(word)
  newBannedWord.value = ''
}

function addBatchBannedWords() {
  const lines = (batchBannedWords.value || '').split('\n').map(l => l.trim()).filter(l => l.length > 0)
  if (lines.length === 0) return ElMessage.warning('请输入至少一个屏蔽词')
  let added = 0
  for (const w of lines) {
    if (!bannedWords.value.includes(w)) {
      bannedWords.value.push(w)
      added++
    }
  }
  batchBannedWords.value = ''
  showBatchInput.value = false
  ElMessage.success('已添加 ' + added + ' 个屏蔽词（' + (lines.length - added) + ' 个重复已跳过）')
}

async function clearAllBannedWords() {
  try {
    await ElMessageBox.confirm('确定要清空所有屏蔽词吗？', '确认清空', { type: 'warning' })
  } catch { return }
  bannedWords.value = []
}

async function saveBannedWords() {
  try {
    await ElMessageBox.confirm(
      '确定保存 ' + bannedWords.value.length + ' 个屏蔽词？保存后立即生效。',
      '确认保存', { type: 'warning' }
    )
  } catch { return }
  try {
    const { data } = await api.put('/admin/banned-words', { words: bannedWords.value })
    if (data.code === 0) {
      ElMessage.success(data.msg || '屏蔽词已保存')
    } else {
      ElMessage.error(data.msg || '保存失败')
    }
  } catch (e) {
    ElMessage.error('保存失败')
  }
}

onMounted(loadHome)
</script>
