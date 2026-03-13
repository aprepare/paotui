<template>
<view class="admin-page">
  <view class="admin-header">
    <text class="admin-title">🛡️ 管理后台</text>
  </view>
  <view class="tab-bar">
    <view v-for="t in tabs" :key="t.key" class="tab-item" :class="{active: currentTab === t.key}" @click="switchTab(t.key)">
      <text class="tab-icon">{{ t.icon }}</text>
      <text class="tab-label">{{ t.label }}</text>
    </view>
  </view>
  <scroll-view :scroll-y="true" class="main-scroll" :scroll-top="scrollTop">
    <view class="section" v-if="currentTab === 'dash'">
      <view class="card-title">📊 数据概览</view>
      <view class="stats-grid">
        <view class="s-card" v-for="s in dashCards" :key="s.label">
          <text class="s-num" :style="{color: s.color}">{{ s.value }}</text>
          <text class="s-label">{{ s.label }}</text>
        </view>
      </view>
      <view class="card-title mt">✏️ 修改首页统计</view>
      <view class="form-row">
        <text class="form-lbl">今日送达</text>
        <input class="form-ipt" type="number" v-model="editStats.todayDelivered" placeholder="今日送达数量" />
      </view>
      <view class="form-row">
        <text class="form-lbl">总订单数</text>
        <input class="form-ipt" type="number" v-model="editStats.totalOrders" placeholder="总订单数量" />
      </view>
      <view class="btn-primary" @click="saveStats"><text>保存统计</text></view>
    </view>
    <view class="section" v-if="currentTab === 'users'">
      <view class="card-title">👥 用户管理</view>
      <view class="search-row">
        <input class="search-ipt" v-model="userKw" placeholder="搜索用户名或手机" @confirm="searchUsers" />
        <view class="btn-sm" @click="searchUsers"><text>搜索</text></view>
      </view>
      <view class="list-item" v-for="u in userList" :key="u._id" @click="showUserActions(u)">
        <view class="li-body">
          <view class="li-top">
            <text class="li-name">{{ u.name || '未设置' }}</text>
            <text class="li-badge green" v-if="u.isRider">骑手</text>
            <text class="li-badge red" v-if="u.disabled">禁用</text>
          </view>
          <text class="li-sub">📱 {{ u.phone || '未绑定' }}</text>
        </view>
        <text class="li-arrow">›</text>
      </view>
      <view class="empty" v-if="!userList.length"><text>暂无数据</text></view>
      <view class="load-more" v-if="userHasMore" @click="loadMoreUsers"><text>加载更多</text></view>
    </view>
    <view class="section" v-if="currentTab === 'orders'">
      <view class="card-title">📦 订单管理</view>
      <view class="chip-row">
        <text class="chip" :class="{active: orderType === 'express'}" @click="orderType='express'; orderPage=1; loadOrders()">快递</text>
        <text class="chip" :class="{active: orderType === 'errand'}" @click="orderType='errand'; orderPage=1; loadOrders()">跑腿</text>
      </view>
      <view class="chip-row">
        <text class="chip sm" :class="{active: orderStatus === -1}" @click="orderStatus=-1; orderPage=1; loadOrders()">全部</text>
        <text class="chip sm" :class="{active: orderStatus === 0}" @click="orderStatus=0; orderPage=1; loadOrders()">待接单</text>
        <text class="chip sm" :class="{active: orderStatus === 1}" @click="orderStatus=1; orderPage=1; loadOrders()">进行中</text>
        <text class="chip sm" :class="{active: orderStatus === 3}" @click="orderStatus=3; orderPage=1; loadOrders()">已完成</text>
      </view>
      <view class="list-item" v-for="o in orderList" :key="o._id">
        <view class="li-body">
          <view class="li-top">
            <text class="li-name">{{ orderType === 'express' ? (o.pickupPoint || '快递') : (o.title || '跑腿') }}</text>
            <text class="li-badge" :class="'st' + o.status">{{ getOrderStatus(o) }}</text>
          </view>
          <text class="li-sub">¥{{ o.price || 0 }}  ·  {{ fmtDate(o.createTime) }}</text>
        </view>
        <view class="li-acts" v-if="o.status === 0 || o.status === 1 || o.status === 2">
          <text class="act-red" @click.stop="cancelOrder(o)">取消</text>
        </view>
      </view>
      <view class="empty" v-if="!orderList.length"><text>暂无数据</text></view>
      <view class="load-more" v-if="orderHasMore" @click="loadMoreOrders"><text>加载更多</text></view>
    </view>
    <view class="section" v-if="currentTab === 'withdraw'">
      <view class="card-title">💰 提现审核</view>
      <view class="chip-row">
        <text class="chip sm" :class="{active: wdStatus === -1}" @click="wdStatus=-1; wdPage=1; loadWithdrawals()">全部</text>
        <text class="chip sm" :class="{active: wdStatus === 0}" @click="wdStatus=0; wdPage=1; loadWithdrawals()">待审核</text>
        <text class="chip sm" :class="{active: wdStatus === 1}" @click="wdStatus=1; wdPage=1; loadWithdrawals()">已通过</text>
        <text class="chip sm" :class="{active: wdStatus === 2}" @click="wdStatus=2; wdPage=1; loadWithdrawals()">已拒绝</text>
      </view>
      <view class="list-item" v-for="w in wdList" :key="w._id">
        <view class="li-body">
          <view class="li-top">
            <text class="li-name">{{ w.userName || '未知用户' }}</text>
            <text class="li-badge" :class="'wd' + w.status">{{ w.status === 0 ? '待审核' : w.status === 1 ? '已通过' : '已拒绝' }}</text>
          </view>
          <text class="li-sub">提现 ¥{{ (w.amount || 0).toFixed(2) }}  ·  {{ fmtDate(w.createTime) }}</text>
        </view>
        <view class="li-acts" v-if="w.status === 0">
          <text class="act-green" @click.stop="approveWd(w)">通过</text>
          <text class="act-red" @click.stop="rejectWd(w)">拒绝</text>
        </view>
      </view>
      <view class="empty" v-if="!wdList.length"><text>暂无提现申请</text></view>
      <view class="load-more" v-if="wdHasMore" @click="loadMoreWd"><text>加载更多</text></view>
    </view>
    <view class="section" v-if="currentTab === 'content'">
      <view class="card-title">📝 内容管理</view>
      <view class="chip-row">
        <text class="chip" :class="{active: contentType === 'forum'}" @click="contentType='forum'; loadContent()">帖子</text>
        <text class="chip" :class="{active: contentType === 'market'}" @click="contentType='market'; loadContent()">商品</text>
        <text class="chip" :class="{active: contentType === 'team'}" @click="contentType='team'; loadContent()">组队</text>

      </view>
      <view class="list-item" v-for="c in contentList" :key="c._id">
        <view class="li-body">
          <view class="li-top"><text class="li-name">{{ getContentTitle(c) }}</text></view>
          <text class="li-sub">{{ c.nickname || c.publisher || '匿名' }}  ·  {{ fmtDate(c.createTime) }}</text>
        </view>
        <view class="li-acts"><text class="act-red" @click.stop="deleteContent(c)">删除</text></view>
      </view>
      <view class="empty" v-if="!contentList.length"><text>暂无数据</text></view>
    </view>
    <view class="section" v-if="currentTab === 'graduate'">
      <view class="card-title">🎓 考研资料管理</view>

      <!-- 资料列表 -->
      <view class="list-item" v-for="gr in graduateResources" :key="gr._id">
        <view class="li-body">
          <view class="li-top">
            <text class="li-name">{{ gr.emoji }} {{ gr.title }}</text>
            <text class="li-badge" :class="gr.status === 1 ? 'green' : 'red'">{{ gr.status === 1 ? '上架' : '下架' }}</text>
          </view>
          <text class="li-sub">{{ gr.category }} · {{ gr.size || '未设置大小' }} · {{ gr.link ? '已设链接' : '未设链接' }}</text>
          <text class="li-sub" v-if="gr.desc">{{ gr.desc }}</text>
        </view>
        <view class="li-acts">
          <text class="act-green" @click.stop="toggleGraduateStatus(gr)">{{ gr.status === 1 ? '下架' : '上架' }}</text>
          <text class="act-red" @click.stop="deleteGraduateResource(gr)">删除</text>
        </view>
      </view>
      <view class="empty" v-if="!graduateResources.length"><text>暂无资料，请添加</text></view>

      <!-- 添加资料表单 -->
      <view class="card-title mt">➕ 添加考研资料</view>
      <view class="form-row"><text class="form-lbl">标题</text><input class="form-ipt" v-model="newResource.title" placeholder="如：考研英语一真题合集" /></view>
      <view class="form-row"><text class="form-lbl">描述</text><input class="form-ipt" v-model="newResource.desc" placeholder="简短描述" /></view>
      <view class="form-row">
        <text class="form-lbl">分类</text>
        <picker :range="resourceCategories" @change="onPickCategory">
          <text class="form-ipt picker-text">{{ newResource.category || '请选择分类' }}</text>
        </picker>
      </view>
      <view class="form-row"><text class="form-lbl">文件大小</text><input class="form-ipt" v-model="newResource.size" placeholder="如 256MB" /></view>
      <view class="form-row"><text class="form-lbl">网盘链接</text><input class="form-ipt" v-model="newResource.link" placeholder="百度网盘/阿里云盘链接" /></view>
      <view class="form-row"><text class="form-lbl">提取码</text><input class="form-ipt" v-model="newResource.password" placeholder="网盘提取码" /></view>
      <view class="form-row"><text class="form-lbl">Emoji</text><input class="form-ipt" v-model="newResource.emoji" placeholder="如 📘 📐 📕" /></view>
      <view class="form-row"><text class="form-lbl">渐变色</text><input class="form-ipt" v-model="newResource.color" placeholder="linear-gradient(135deg, #63B3ED, #2B6CB0)" /></view>
      <view class="btn-primary" @click="addGraduateResource"><text>添加资料</text></view>
    </view>
    <view class="section" v-if="currentTab === 'wash'">
      <view class="card-title">🧼 萌马洗护管理</view>
      <view class="chip-row">
        <text class="chip" :class="{active: washTab === 'products'}" @click="washTab='products'">商品</text>
        <text class="chip" :class="{active: washTab === 'orders'}" @click="washTab='orders'; loadWashOrders()">订单</text>
      </view>

      <!-- 商品管理 -->
      <view v-if="washTab === 'products'">
        <view class="list-item" v-for="wp in washProducts" :key="wp._id">
          <view class="li-body">
            <view class="li-top">
              <text class="li-name">{{ wp.name }}</text>
              <text class="li-badge" :class="wp.status === 1 ? 'green' : 'red'">{{ wp.status === 1 ? '上架' : '下架' }}</text>
            </view>
            <text class="li-sub">原价¥{{ wp.originalPrice }} → 团购¥{{ wp.groupPrice }}  ·  {{ wp.groupSize }}人团</text>
          </view>
          <view class="li-acts">
            <text class="act-green" @click.stop="toggleWashStatus(wp)">{{ wp.status === 1 ? '下架' : '上架' }}</text>
            <text class="act-red" @click.stop="deleteWashProduct(wp)">删除</text>
          </view>
        </view>
        <view class="empty" v-if="!washProducts.length"><text>暂无商品，请添加</text></view>
        <view class="card-title mt">➕ 添加团购商品</view>
        <view class="form-row"><text class="form-lbl">商品名</text><input class="form-ipt" v-model="newWash.name" placeholder="如：运动鞋清洗" /></view>
        <view class="form-row"><text class="form-lbl">描述</text><input class="form-ipt" v-model="newWash.desc" placeholder="简短描述" /></view>
        <view class="form-row"><text class="form-lbl">原价</text><input class="form-ipt" type="digit" v-model="newWash.originalPrice" placeholder="原价（元）" /></view>
        <view class="form-row"><text class="form-lbl">团购价</text><input class="form-ipt" type="digit" v-model="newWash.groupPrice" placeholder="团购价（元）" /></view>
        <view class="form-row"><text class="form-lbl">成团人数</text><input class="form-ipt" type="number" v-model="newWash.groupSize" placeholder="如 3" /></view>
        <view class="btn-primary" @click="addWashProduct"><text>添加商品</text></view>
      </view>

      <!-- 洗护订单管理 -->
      <view v-if="washTab === 'orders'">
        <view class="chip-row">
          <text class="chip sm" :class="{active: washOrderStatus === -1}" @click="washOrderStatus=-1; washOrderPage=1; loadWashOrders()">全部</text>
          <text class="chip sm" :class="{active: washOrderStatus === 0}" @click="washOrderStatus=0; washOrderPage=1; loadWashOrders()">待处理</text>
          <text class="chip sm" :class="{active: washOrderStatus === 1}" @click="washOrderStatus=1; washOrderPage=1; loadWashOrders()">处理中</text>
          <text class="chip sm" :class="{active: washOrderStatus === 2}" @click="washOrderStatus=2; washOrderPage=1; loadWashOrders()">已完成</text>
          <text class="chip sm" :class="{active: washOrderStatus === 3}" @click="washOrderStatus=3; washOrderPage=1; loadWashOrders()">已取消</text>
        </view>
        <view class="list-item" v-for="wo in washOrders" :key="wo._id">
          <view class="li-body">
            <view class="li-top">
              <text class="li-name">{{ wo.productName }} x{{ wo.quantity }}</text>
              <text class="li-badge mode" v-if="wo.needDelivery">🏃跑腿</text>
              <text class="li-badge" :class="'st' + wo.status">{{ wo.statusText || getWashStatusText(wo) }}</text>
            </view>
            <text class="li-sub">¥{{ (wo.totalPrice || 0).toFixed(2) }} · {{ wo.phone || '' }} · {{ fmtDate(wo.createTime) }}</text>
            <text class="li-sub" v-if="wo.address">📍 {{ wo.address }}</text>
            <text class="li-sub" v-if="wo.remark">💬 {{ wo.remark }}</text>
          </view>
          <view class="li-acts">
            <text class="act-green" v-if="wo.status < 2" @click.stop="advanceWashOrder(wo)">{{ wo.status === 0 ? '开始处理' : '标记完成' }}</text>
            <text class="act-red" v-if="wo.status === 0" @click.stop="cancelWashOrder(wo)">取消</text>
          </view>
        </view>
        <view class="empty" v-if="!washOrders.length"><text>暂无订单</text></view>
        <view class="load-more" v-if="washOrderHasMore" @click="washOrderPage++; loadWashOrders()"><text>加载更多</text></view>
      </view>
    </view>
    <view class="section" v-if="currentTab === 'food'">
      <view class="card-title">🍔 外卖管理</view>
      <view class="chip-row">
        <text class="chip" :class="{active: foodTab === 'shops'}" @click="foodTab='shops'">商家</text>
        <text class="chip" :class="{active: foodTab === 'items'}" @click="foodTab='items'">菜品</text>
        <text class="chip" :class="{active: foodTab === 'orders'}" @click="foodTab='orders'">订单</text>
        <text class="chip" :class="{active: foodTab === 'printer'}" @click="foodTab='printer'">打印机</text>
      </view>

      <!-- 商家管理 -->
      <view v-if="foodTab === 'shops'">
        <view class="list-item" v-for="s in foodShops" :key="s._id">
          <view class="li-body">
            <view class="li-top">
              <text class="li-name">{{ s.name }}</text>
              <text class="li-badge" :class="s.status === 1 ? 'green' : 'red'">{{ s.status === 1 ? '营业' : '休息' }}</text>
            </view>
            <text class="li-sub">{{ s.category }} · 配送¥{{ s.deliveryFee || 0 }} · {{ s.minOrder || 0 }}起送</text>
          </view>
          <view class="li-acts">
            <text class="act-green" @click.stop="editShopItems(s)">菜品</text>
            <text class="act-green" @click.stop="toggleShopStatus(s)">{{ s.status === 1 ? '休息' : '营业' }}</text>
            <text class="act-red" @click.stop="deleteFoodShop(s)">删除</text>
          </view>
        </view>
        <view class="empty" v-if="!foodShops.length"><text>暂无商家</text></view>
        <view class="card-title mt">➕ 添加商家</view>
        <view class="form-row"><text class="form-lbl">名称</text><input class="form-ipt" v-model="newShop.name" placeholder="商家名称" /></view>
        <view class="form-row"><text class="form-lbl">分类</text><input class="form-ipt" v-model="newShop.category" placeholder="快餐/饮品/小吃" /></view>
        <view class="form-row"><text class="form-lbl">电话</text><input class="form-ipt" v-model="newShop.phone" placeholder="商家电话" type="number" /></view>
        <view class="form-row"><text class="form-lbl">地址</text><input class="form-ipt" v-model="newShop.address" placeholder="商家地址" /></view>
        <view class="form-row"><text class="form-lbl">配送费</text><input class="form-ipt" v-model="newShop.deliveryFee" placeholder="配送费（元）" type="digit" /></view>
        <view class="form-row"><text class="form-lbl">起送价</text><input class="form-ipt" v-model="newShop.minOrder" placeholder="起送价（元）" type="digit" /></view>
        <view class="form-row"><text class="form-lbl">打印机SN</text><input class="form-ipt" v-model="newShop.printerSn" placeholder="飞鹅打印机SN（可选）" /></view>
        <view class="form-row"><text class="form-lbl">营业时间</text><input class="form-ipt" v-model="newShop.openTime" placeholder="08:00" /></view>
        <view class="form-row"><text class="form-lbl">打烊时间</text><input class="form-ipt" v-model="newShop.closeTime" placeholder="22:00" /></view>
        <view class="btn-primary" @click="addFoodShop"><text>添加商家</text></view>
      </view>

      <!-- 菜品管理 -->
      <view v-if="foodTab === 'items'">
        <view class="form-row" v-if="foodShops.length">
          <text class="form-lbl">选商家</text>
          <picker :range="foodShops" range-key="name" @change="onPickShop">
            <text class="form-ipt picker-text">{{ selectedShop ? selectedShop.name : '请选择商家' }}</text>
          </picker>
        </view>
        <view v-if="selectedShop">
          <view class="list-item" v-for="fi in foodItems" :key="fi._id">
            <view class="li-body">
              <view class="li-top">
                <text class="li-name">{{ fi.name }}</text>
                <text class="li-badge" :class="fi.status === 1 ? 'green' : 'red'">{{ fi.status === 1 ? '上架' : '下架' }}</text>
              </view>
              <text class="li-sub">¥{{ fi.price }} · {{ fi.category || '热销' }}</text>
            </view>
            <view class="li-acts">
              <text class="act-green" @click.stop="toggleItemStatus(fi)">{{ fi.status === 1 ? '下架' : '上架' }}</text>
              <text class="act-red" @click.stop="deleteFoodItem(fi)">删除</text>
            </view>
          </view>
          <view class="empty" v-if="!foodItems.length"><text>暂无菜品</text></view>
          <view class="card-title mt">➕ 添加菜品</view>
          <view class="form-row"><text class="form-lbl">名称</text><input class="form-ipt" v-model="newItem.name" placeholder="菜品名称" /></view>
          <view class="form-row"><text class="form-lbl">价格</text><input class="form-ipt" v-model="newItem.price" placeholder="价格（元）" type="digit" /></view>
          <view class="form-row"><text class="form-lbl">分类</text><input class="form-ipt" v-model="newItem.category" placeholder="热销/主食/饮品" /></view>
          <view class="form-row"><text class="form-lbl">描述</text><input class="form-ipt" v-model="newItem.desc" placeholder="简短描述（可选）" /></view>
          <view class="btn-primary" @click="addFoodItem"><text>添加菜品</text></view>
        </view>
        <view class="empty" v-if="!foodShops.length"><text>请先添加商家</text></view>
      </view>

      <!-- 订单管理 -->
      <view v-if="foodTab === 'orders'">
        <view class="chip-row">
          <text class="chip sm" :class="{active: foodOrderStatus === -1}" @click="foodOrderStatus=-1; foodOrderPage=1; loadFoodOrders()">全部</text>
          <text class="chip sm" :class="{active: foodOrderStatus === 0}" @click="foodOrderStatus=0; foodOrderPage=1; loadFoodOrders()">待确认</text>
          <text class="chip sm" :class="{active: foodOrderStatus === 1}" @click="foodOrderStatus=1; foodOrderPage=1; loadFoodOrders()">制作中</text>
          <text class="chip sm" :class="{active: foodOrderStatus === 2}" @click="foodOrderStatus=2; foodOrderPage=1; loadFoodOrders()">配送/自取</text>
          <text class="chip sm" :class="{active: foodOrderStatus === 3}" @click="foodOrderStatus=3; foodOrderPage=1; loadFoodOrders()">已完成</text>
        </view>
        <view class="list-item" v-for="fo in foodOrders" :key="fo._id">
          <view class="li-body">
            <view class="li-top">
              <text class="li-name">{{ fo.shopName }} #{{ (fo._id || '').substr(-4) }}</text>
              <text class="li-badge mode" v-if="fo.deliveryMode">{{ fo.deliveryMode === 'self_pickup' ? '🏪自取' : '🚴配送' }}</text>
              <text class="li-badge" :class="'st' + fo.status">{{ fo.statusText || getFoodStatusText(fo) }}</text>
            </view>
            <text class="li-sub">¥{{ (fo.totalPrice || 0).toFixed(2) }} · {{ fo.address || '到店自取' }} · {{ fmtDate(fo.createTime) }}</text>
          </view>
          <view class="li-acts">
            <text class="act-green" v-if="fo.status < 3 && fo.status !== 4" @click.stop="advanceFoodOrder(fo)">{{ getFoodNextAction(fo) }}</text>
            <text class="act-green" @click.stop="reprintOrder(fo)">打印</text>
            <text class="act-red" v-if="fo.status <= 1" @click.stop="cancelFoodOrder(fo)">取消</text>
          </view>
        </view>
        <view class="empty" v-if="!foodOrders.length"><text>暂无订单</text></view>
        <view class="load-more" v-if="foodOrderHasMore" @click="foodOrderPage++; loadFoodOrders()"><text>加载更多</text></view>
      </view>

      <!-- 打印机配置 -->
      <view v-if="foodTab === 'printer'">
        <view class="icon-tip"><text>配置飞鹅云打印机账号，用于自动打印外卖订单小票。注册地址：feieyun.com</text></view>
        <view class="form-row"><text class="form-lbl">账号</text><input class="form-ipt" v-model="printerCfg.user" placeholder="飞鹅开放平台账号" /></view>
        <view class="form-row"><text class="form-lbl">UKEY</text><input class="form-ipt" v-model="printerCfg.ukey" placeholder="飞鹅UKEY" /></view>
        <view class="form-row"><text class="form-lbl">默认SN</text><input class="form-ipt" v-model="printerCfg.defaultSn" placeholder="默认打印机SN编号" /></view>
        <view class="btn-primary" @click="savePrinterConfig"><text>保存打印机配置</text></view>
      </view>
    </view>
    <view class="section" v-if="currentTab === 'config'">
      <view class="card-title">🖼️ 轮播图管理</view>
      <view class="banner-edit" v-for="(b, i) in editBanners" :key="i">
        <view class="be-head">
          <text class="be-idx">轮播 {{ i + 1 }}</text>
          <text class="act-red" @click="removeBanner(i)">删除</text>
        </view>
        <view class="form-row">
          <text class="form-lbl">图片</text>
          <view class="btn-upload-sm" @click="uploadBannerImage(i)"><text>上传图片</text></view>
        </view>
        <view class="icon-preview-row" v-if="editBanners[i].imageUrl">
          <image class="banner-preview-img" :src="editBanners[i].imageUrl" mode="aspectFill" />
          <text class="act-red" @click="editBanners[i].imageUrl = ''">移除图片</text>
        </view>
        <view class="form-row"><text class="form-lbl">标题</text><input class="form-ipt" v-model="editBanners[i].title" placeholder="轮播标题（图片模式下不显示）" /></view>
        <view class="form-row"><text class="form-lbl">描述</text><input class="form-ipt" v-model="editBanners[i].desc" placeholder="轮播描述（图片模式下不显示）" /></view>
        <view class="form-row"><text class="form-lbl">背景</text><input class="form-ipt" v-model="editBanners[i].bg" placeholder="linear-gradient(...)（图片模式下不生效）" /></view>
      </view>
      <view class="btn-outline" @click="addBanner"><text>+ 添加轮播</text></view>
      <view class="card-title mt">⚡ 快捷操作</view>
      <view class="banner-edit" v-for="(a, j) in editActions" :key="'a'+j">
        <view class="be-head">
          <text class="be-idx">操作 {{ j + 1 }}</text>
          <text class="act-red" @click="removeAction(j)">删除</text>
        </view>
        <view class="form-row"><text class="form-lbl">Emoji</text>
          <input class="form-ipt-short" v-model="editActions[j].emoji" placeholder="如 📦" />
          <view class="icon-or"><text>或</text></view>
          <view class="btn-upload-sm" @click="uploadActionIcon(j)"><text>上传图片</text></view>
        </view>
        <view class="form-row" v-if="editActions[j].iconUrl"><text class="form-lbl">图标</text><image :src="editActions[j].iconUrl" style="width:60rpx;height:60rpx;" mode="aspectFit" /></view>
        <view class="form-row"><text class="form-lbl">文字</text><input class="form-ipt" v-model="editActions[j].text" placeholder="按钮文字" /></view>
        <view class="form-row"><text class="form-lbl">链接</text><input class="form-ipt" v-model="editActions[j].link" placeholder="/pages/express/create" /></view>
      </view>
      <view class="btn-outline" @click="addAction"><text>+ 添加操作</text></view>
      <view class="btn-primary mt" @click="savePageConfig"><text>保存首页配置</text></view>

      <view class="card-title mt">🎨 福利页配置</view>

      <view class="card-title-sub">🖼️ 福利页轮播图</view>
      <view class="icon-tip"><text>上传图片后显示图片，未上传则显示渐变背景+文字</text></view>
      <view class="banner-edit" v-for="(wb, wi) in editWelfareBanners" :key="'wb'+wi">
        <view class="be-head">
          <text class="be-idx">轮播 {{ wi + 1 }}</text>
          <text class="act-red" @click="removeWelfareBanner(wi)">删除</text>
        </view>
        <view class="form-row">
          <text class="form-lbl">图片</text>
          <view class="btn-upload-sm" @click="uploadWelfareBannerImage(wi)"><text>上传图片</text></view>
        </view>
        <view class="icon-preview-row" v-if="editWelfareBanners[wi].imageUrl">
          <image class="banner-preview-img" :src="editWelfareBanners[wi].imageUrl" mode="aspectFill" />
          <text class="act-red" @click="editWelfareBanners[wi].imageUrl = ''">移除图片</text>
        </view>
        <view class="form-row"><text class="form-lbl">标题</text><input class="form-ipt" v-model="editWelfareBanners[wi].title" placeholder="轮播标题" /></view>
        <view class="form-row"><text class="form-lbl">描述</text><input class="form-ipt" v-model="editWelfareBanners[wi].desc" placeholder="轮播描述" /></view>
        <view class="form-row"><text class="form-lbl">背景</text><input class="form-ipt" v-model="editWelfareBanners[wi].bg" placeholder="linear-gradient(...)（上传图片后不生效）" /></view>
      </view>
      <view class="btn-outline" @click="addWelfareBanner"><text>+ 添加轮播</text></view>

      <view class="card-title-sub mt">🎯 福利页服务图标</view>
      <view class="icon-tip"><text>管理福利页的服务入口，支持上传图片</text></view>
      <view class="banner-edit" v-for="(s, si) in editServices" :key="'s'+si">
        <view class="be-head">
          <text class="be-idx">服务 {{ si + 1 }}</text>
          <text class="act-red" @click="removeService(si)">删除</text>
        </view>
        <view class="form-row">
          <text class="form-lbl">图标</text>
          <view class="btn-upload-sm" @click="uploadServiceIcon(si)"><text>上传图片</text></view>
        </view>
        <view class="icon-preview-row" v-if="editServices[si].iconUrl">
          <image class="icon-preview-img" :src="editServices[si].iconUrl" mode="aspectFit" />
          <text class="act-red" @click="editServices[si].iconUrl = ''">移除图片</text>
        </view>
        <view class="form-row"><text class="form-lbl">名称</text><input class="form-ipt" v-model="editServices[si].text" placeholder="服务名称" /></view>
        <view class="form-row"><text class="form-lbl">描述</text><input class="form-ipt" v-model="editServices[si].desc" placeholder="简短描述" /></view>
        <view class="form-row"><text class="form-lbl">链接</text><input class="form-ipt" v-model="editServices[si].url" placeholder="/pages/team/index" /></view>
        <view class="form-row"><text class="form-lbl">渐变色</text><input class="form-ipt" v-model="editServices[si].gradient" placeholder="linear-gradient(...)" /></view>
      </view>
      <view class="btn-outline" @click="addService"><text>+ 添加服务</text></view>
      <view class="btn-primary mt" @click="saveWelfareConfig"><text>保存福利页配置</text></view>

      <view class="card-title mt">🔽 底部TabBar图标</view>
      <view class="icon-tip"><text>上传自定义TabBar图标（需要普通态+选中态各一张，建议81x81px PNG）</text></view>
      <view class="banner-edit" v-for="(tb, ti) in editTabItems" :key="'tb'+ti">
        <view class="be-head">
          <text class="be-idx">{{ tb.text }}</text>
        </view>
        <view class="tab-icon-row">
          <view class="tab-icon-col">
            <text class="tab-icon-label">普通图标</text>
            <image v-if="tb.iconUrl" class="tab-icon-preview" :src="tb.iconUrl" mode="aspectFit" />
            <view class="tab-icon-placeholder" v-else><text>未设置</text></view>
            <view class="btn-upload-sm" @click="uploadTabIcon(ti, 'icon')"><text>上传</text></view>
          </view>
          <view class="tab-icon-col">
            <text class="tab-icon-label">选中图标</text>
            <image v-if="tb.selectedIconUrl" class="tab-icon-preview" :src="tb.selectedIconUrl" mode="aspectFit" />
            <view class="tab-icon-placeholder" v-else><text>未设置</text></view>
            <view class="btn-upload-sm" @click="uploadTabIcon(ti, 'selected')"><text>上传</text></view>
          </view>
        </view>
      </view>
      <view class="btn-primary mt" @click="saveTabBarConfig"><text>保存TabBar配置</text></view>
    </view>
    <view class="section" v-if="currentTab === 'admins'">
      <view class="card-title">👑 管理员列表</view>
      <view class="list-item" v-for="a in adminList" :key="a.phone">
        <view class="li-body">
          <view class="li-top">
            <text class="li-name">{{ a.name || a.phone }}</text>
            <text class="li-badge green" v-if="a.isDefault">默认</text>
          </view>
          <text class="li-sub">📱 {{ a.phone }}</text>
        </view>
        <view class="li-acts" v-if="!a.isDefault">
          <text class="act-red" @click.stop="removeAdmin(a)">移除</text>
        </view>
      </view>
      <view class="empty" v-if="!adminList.length"><text>暂无数据</text></view>
      <view class="card-title mt">➕ 添加管理员</view>
      <view class="form-row"><text class="form-lbl">手机号</text><input class="form-ipt" v-model="newAdminPhone" placeholder="输入手机号" type="number" /></view>
      <view class="form-row"><text class="form-lbl">备注名</text><input class="form-ipt" v-model="newAdminName" placeholder="可选备注" /></view>
      <view class="btn-primary" @click="addAdmin"><text>添加管理员</text></view>
      <view class="card-title mt">📢 系统公告</view>
      <view class="form-row"><text class="form-lbl">标题</text><input class="form-ipt" v-model="noticeTitle" placeholder="公告标题" /></view>
      <view class="form-row">
        <text class="form-lbl">内容</text>
        <textarea class="form-textarea" v-model="noticeContent" placeholder="公告内容"></textarea>
      </view>
      <view class="btn-primary" @click="sendNotice"><text>发送给所有用户</text></view>
    </view>
  </scroll-view>
</view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { callCloud } from '@/utils/cloud.js'
const scrollTop = ref(0)
const currentTab = ref('dash')
const tabs = [
  { key: 'dash', icon: '📊', label: '概览' },
  { key: 'users', icon: '👥', label: '用户' },
  { key: 'orders', icon: '📦', label: '订单' },
  { key: 'withdraw', icon: '💰', label: '提现' },
  { key: 'content', icon: '📝', label: '内容' },
  { key: 'graduate', icon: '🎓', label: '考研' },
  { key: 'wash', icon: '🧼', label: '洗护' },
  { key: 'food', icon: '🍔', label: '外卖' },
  { key: 'config', icon: '🖼️', label: '配置' },
  { key: 'admins', icon: '👑', label: '管理' }
]
const switchTab = (key) => {
  currentTab.value = key
  scrollTop.value = scrollTop.value === 0 ? 0.01 : 0
  if (key === 'dash') loadDashboard()
  if (key === 'users') { userPage = 1; loadUsers() }
  if (key === 'orders') { orderPage = 1; loadOrders() }
  if (key === 'withdraw') { wdPage = 1; loadWithdrawals() }
  if (key === 'content') loadContent()
  if (key === 'config') { loadPageConfig(); loadIconConfig() }
  if (key === 'graduate') loadGraduateResources()
  if (key === 'wash') { loadWashProducts(); loadWashOrders() }
  if (key === 'food') { loadFoodShops(); loadFoodOrders(); loadPrinterConfig() }
  if (key === 'admins') loadAdmins()
}
const dash = reactive({ userCount: 0, expressCount: 0, errandCount: 0, carpoolCount: 0, forumCount: 0, marketCount: 0, teamCount: 0, riderCount: 0, pendingExpress: 0, pendingErrand: 0, todayDelivered: 0, totalOrders: 0 })
const editStats = reactive({ todayDelivered: '', totalOrders: '' })
const dashCards = computed(() => [
  { label: '用户总数', value: dash.userCount, color: '#2B6CB0' },
  { label: '骑手数', value: dash.riderCount, color: '#38A169' },
  { label: '快递单', value: dash.expressCount, color: '#DD6B20' },
  { label: '跑腿单', value: dash.errandCount, color: '#D53F8C' },
  { label: '待接快递', value: dash.pendingExpress, color: '#E53E3E' },
  { label: '待接跑腿', value: dash.pendingErrand, color: '#E53E3E' },

  { label: '帖子', value: dash.forumCount, color: '#805AD5' },
  { label: '商品', value: dash.marketCount, color: '#D69E2E' },
  { label: '组队', value: dash.teamCount, color: '#2B6CB0' }
])
const loadDashboard = async () => {
  uni.showLoading({ title: '加载中' })
  var res = await callCloud('admin', 'dashboard')
  uni.hideLoading()
  if (res.code === 0) { Object.assign(dash, res.data); editStats.todayDelivered = String(dash.todayDelivered || 0); editStats.totalOrders = String(dash.totalOrders || 0) }
}
const saveStats = async () => {
  uni.showLoading({ title: '保存中' })
  var res = await callCloud('admin', 'updateStats', { todayDelivered: Number(editStats.todayDelivered) || 0, totalOrders: Number(editStats.totalOrders) || 0 })
  uni.hideLoading()
  if (res.code === 0) { uni.showToast({ title: '保存成功', icon: 'success' }); loadDashboard() }
}
const userKw = ref('')
const userList = ref([])
const userHasMore = ref(false)
var userPage = 1
const loadUsers = async () => {
  var res = await callCloud('admin', 'userList', { page: userPage, keyword: userKw.value })
  if (res.code === 0) { userList.value = res.data || []; userHasMore.value = (res.data || []).length >= 20 }
}
const searchUsers = () => { userPage = 1; loadUsers() }
const loadMoreUsers = () => { userPage++; loadUsers() }
const showUserActions = (u) => {
  var items = ['查看详情']
  if (!u.disabled) items.push('禁用该用户'); else items.push('启用该用户')
  items.push('设为管理员')
  uni.showActionSheet({ itemList: items, success: async (res) => {
    if (res.tapIndex === 0) {
      uni.showLoading({ title: '加载中' })
      var detail = await callCloud('admin', 'userDetail', { userId: u._id })
      uni.hideLoading()
      if (detail.code === 0) { var d = detail.data; uni.showModal({ title: d.name || '用户详情', content: '手机: ' + (d.phone || '无') + '\n骑手: ' + (d.isRider ? '是' : '否') + '\n快递单: ' + (d.expressCount || 0) + '\n跑腿单: ' + (d.errandCount || 0) + '\n帖子: ' + (d.forumCount || 0), showCancel: false }) }
    } else if (res.tapIndex === 1) {
      uni.showLoading({ title: '处理中' })
      var r = await callCloud('admin', 'toggleUserStatus', { userId: u._id, disabled: !u.disabled })
      uni.hideLoading()
      if (r.code === 0) { uni.showToast({ title: '操作成功', icon: 'success' }); loadUsers() }
    } else if (res.tapIndex === 2) {
      uni.showModal({ title: '确认', content: '确定将 ' + (u.name || u.phone) + ' 设为管理员？', success: async (mr) => {
        if (mr.confirm) { var r2 = await callCloud('admin', 'setUserAdmin', { userId: u._id }); if (r2.code === 0) uni.showToast({ title: '已设为管理员', icon: 'success' }); else uni.showToast({ title: r2.msg || '操作失败', icon: 'none' }) }
      }})
    }
  }})
}
const orderType = ref('express')
const orderStatus = ref(-1)
const orderList = ref([])
const orderHasMore = ref(false)
var orderPage = 1
const loadOrders = async () => {
  var action = orderType.value === 'express' ? 'expressList' : 'errandList'
  var res = await callCloud('admin', action, { page: orderPage, status: orderStatus.value })
  if (res.code === 0) { orderList.value = res.data || []; orderHasMore.value = (res.data || []).length >= 20 }
}
const loadMoreOrders = () => { orderPage++; loadOrders() }
const expressStatusMap = { 0: '待接单', 1: '已接单', 2: '配送中', 3: '已完成', 4: '已取消' }
const errandStatusMap = { 0: '待接单', 1: '进行中', 2: '已完成', 3: '已取消' }
const getOrderStatus = (o) => orderType.value === 'express' ? (expressStatusMap[o.status] || '未知') : (errandStatusMap[o.status] || '未知')
const cancelOrder = (o) => {
  uni.showModal({ title: '确认取消', content: '确定取消该订单？', success: async (r) => {
    if (r.confirm) { var act = orderType.value === 'express' ? 'cancelExpress' : 'cancelErrand'; var idKey = orderType.value === 'express' ? 'orderId' : 'taskId'; var res = await callCloud('admin', act, { [idKey]: o._id }); if (res.code === 0) { uni.showToast({ title: '已取消', icon: 'success' }); loadOrders() } }
  }})
}

// ========== 提现审核 ==========
const wdStatus = ref(-1)
const wdList = ref([])
const wdHasMore = ref(false)
var wdPage = 1
const loadWithdrawals = async () => {
  var params = { page: wdPage, pageSize: 20 }
  if (wdStatus.value !== -1) params.status = wdStatus.value
  var res = await callCloud('admin', 'withdrawList', params)
  if (res.code === 0) { wdList.value = res.data || []; wdHasMore.value = (res.data || []).length >= 20 }
}
const loadMoreWd = () => { wdPage++; loadWithdrawals() }
const approveWd = (w) => {
  uni.showModal({ title: '确认通过', content: '确定通过 ' + (w.userName || '') + ' 的提现申请 ¥' + (w.amount || 0).toFixed(2) + '？\n通过后请手动转账到该用户微信。', success: async (r) => {
    if (r.confirm) { var res = await callCloud('admin', 'approveWithdraw', { withdrawId: w._id }); if (res.code === 0) { uni.showToast({ title: '已通过', icon: 'success' }); loadWithdrawals() } }
  }})
}
const rejectWd = (w) => {
  uni.showModal({ title: '拒绝提现', content: '确定拒绝该提现申请？', success: async (r) => {
    if (r.confirm) { var res = await callCloud('admin', 'rejectWithdraw', { withdrawId: w._id, reason: '管理员拒绝' }); if (res.code === 0) { uni.showToast({ title: '已拒绝', icon: 'success' }); loadWithdrawals() } }
  }})
}

const contentType = ref('forum')
const contentList = ref([])
const loadContent = async () => {
  var m = { forum: 'forumList', market: 'marketList', team: 'teamList' }
  var res = await callCloud('admin', m[contentType.value])
  if (res.code === 0) contentList.value = res.data || []
}
const getContentTitle = (c) => {
  if (contentType.value === 'forum') return c.content ? c.content.substring(0, 30) : '无内容'
  if (contentType.value === 'market') return c.title || c.name || '商品'
  if (contentType.value === 'team') return c.title || c.name || '组队'

  return '未知'
}
const deleteContent = (c) => {
  var am = { forum: 'deletePost', market: 'deleteGoods', team: 'deleteTeam' }
  var im = { forum: 'postId', market: 'goodsId', team: 'activityId' }
  uni.showModal({ title: '确认删除', content: '删除后不可恢复', success: async (r) => {
    if (r.confirm) { var res = await callCloud('admin', am[contentType.value], { [im[contentType.value]]: c._id }); if (res.code === 0) { uni.showToast({ title: '已删除', icon: 'success' }); loadContent() } }
  }})
}
const editBanners = ref([])
const editActions = ref([])
const loadPageConfig = async () => {
  var res = await callCloud('admin', 'getPageConfig')
  if (res.code === 0 && res.data) { editBanners.value = (res.data.banners || []).map(b => ({ ...b })); editActions.value = (res.data.actions || []).map(a => ({ ...a })) }
  if (!editBanners.value.length) editBanners.value = [{ imageUrl: '', title: '快递代取 极速送达', desc: '下单后最快30分钟送到宿舍', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' }, { imageUrl: '', title: '万能跑腿 有求必应', desc: '买饭、打印、取件 一键搞定', bg: 'linear-gradient(135deg, #ED8936, #DD6B20)' }, { imageUrl: '', title: '新用户首单立减', desc: '注册即享优惠 快来体验吧', bg: 'linear-gradient(135deg, #48BB78, #38A169)' }]
  if (!editActions.value.length) editActions.value = [{ emoji: '📦', text: '代取快递', link: '/pages/express/create' }, { emoji: '🏃', text: '万能跑腿', link: '/pages/errand/create' }, { emoji: '🏅', text: '骑手注册', link: '/pages/express/rider-register' }]
}
const addBanner = () => editBanners.value.push({ imageUrl: '', title: '', desc: '', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' })
const removeBanner = (i) => editBanners.value.splice(i, 1)
const uploadBannerImage = (idx) => {
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: function(chooseRes) {
      var tempPath = chooseRes.tempFilePaths[0]
      uni.showLoading({ title: '上传中' })
      var cloudPath = 'banners/banner_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '.png'
      wx.cloud.uploadFile({
        cloudPath: cloudPath, filePath: tempPath,
        success: function(upRes) {
          editBanners.value[idx].imageUrl = upRes.fileID
          uni.hideLoading()
          uni.showToast({ title: '上传成功', icon: 'success' })
        },
        fail: function() { uni.hideLoading(); uni.showToast({ title: '上传失败', icon: 'none' }) }
      })
    }
  })
}
const addAction = () => editActions.value.push({ emoji: '', iconUrl: '', text: '', link: '' })
const removeAction = (j) => editActions.value.splice(j, 1)
const uploadActionIcon = (idx) => {
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: function(chooseRes) {
      var tempPath = chooseRes.tempFilePaths[0]
      uni.showLoading({ title: '上传中' })
      var cloudPath = 'icons/action_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '.png'
      wx.cloud.uploadFile({
        cloudPath: cloudPath, filePath: tempPath,
        success: function(upRes) {
          editActions.value[idx].iconUrl = upRes.fileID
          editActions.value[idx].emoji = ''
          uni.hideLoading()
          uni.showToast({ title: '上传成功', icon: 'success' })
        },
        fail: function() { uni.hideLoading(); uni.showToast({ title: '上传失败', icon: 'none' }) }
      })
    }
  })
}
const savePageConfig = async () => {
  uni.showLoading({ title: '保存中' })
  var res = await callCloud('admin', 'savePageConfig', { banners: editBanners.value, actions: editActions.value })
  uni.hideLoading()
  if (res.code === 0) uni.showToast({ title: '保存成功', icon: 'success' })
}
const adminList = ref([])
// ========== 图标管理 ==========
const editServices = ref([])
const editWelfareBanners = ref([])
const defaultWelfareBanners = [
  { imageUrl: '', title: '新学期福利大放送', desc: '多重优惠等你来领', bg: 'linear-gradient(135deg, #F6AD55 0%, #ED8936 50%, #DD6B20 100%)' },
  { imageUrl: '', title: '快递代取 首单立减', desc: '新用户专享优惠', bg: 'linear-gradient(135deg, #63B3ED 0%, #4299E1 50%, #2B6CB0 100%)' },
  { imageUrl: '', title: '拼车出行 安全省钱', desc: '校园出行好帮手', bg: 'linear-gradient(135deg, #68D391 0%, #48BB78 50%, #38A169 100%)' },
  { imageUrl: '', title: '校园兼职 轻松赚零花', desc: '海量岗位等你来', bg: 'linear-gradient(135deg, #F687B3 0%, #ED64A6 50%, #D53F8C 100%)' }
]
const editTabItems = ref([
  { text: '首页', iconUrl: '', selectedIconUrl: '' },
  { text: '兼职', iconUrl: '', selectedIconUrl: '' },
  { text: '广场', iconUrl: '', selectedIconUrl: '' },
  { text: '福利', iconUrl: '', selectedIconUrl: '' },
  { text: '我的', iconUrl: '', selectedIconUrl: '' }
])
const defaultServices = [
  { iconUrl: '/static/welfare/dazi.png', text: '校园搭子', desc: '找搭子一起', url: '/pages/team/index', gradient: 'linear-gradient(135deg, #63B3ED, #2B6CB0)' },
  { iconUrl: '/static/welfare/xihu.png', text: '萌马洗护', desc: '洗护服务', url: '/pages/wash/index', gradient: 'linear-gradient(135deg, #F6AD55, #DD6B20)' },
  { iconUrl: '/static/welfare/jineng.png', text: '技能出租', desc: '技能变现', url: '/pages/skill/index', gradient: 'linear-gradient(135deg, #F687B3, #D53F8C)' },
  { iconUrl: '/static/welfare/kaoyan.png', text: '考研服务', desc: '考研加油', url: '/pages/graduate/index', gradient: 'linear-gradient(135deg, #4FD1C5, #319795)' },
  { iconUrl: '/static/welfare/ershou.png', text: '二手市场', desc: '闲置换钱', url: '/pages/market/index', gradient: 'linear-gradient(135deg, #FC8181, #E53E3E)' },
  { iconUrl: '/static/welfare/bashi.png', text: '小岛巴士', desc: '校园出行', url: '', gradient: 'linear-gradient(135deg, #B794F4, #805AD5)' },
  { iconUrl: '/static/welfare/waimai.png', text: '福利外卖', desc: '优惠点餐', url: '/pages/food/index', gradient: 'linear-gradient(135deg, #FBD38D, #DD6B20)' }
]
const loadIconConfig = async () => {
  uni.showLoading({ title: '加载中' })
  var res = await callCloud('admin', 'getWelfareConfig')
  uni.hideLoading()
  if (res.code === 0 && res.data) {
    if (res.data.services && res.data.services.length) {
      editServices.value = res.data.services.map(function(s) { return { ...s } })
    } else {
      editServices.value = defaultServices.map(function(s) { return { ...s } })
    }
    if (res.data.banners && res.data.banners.length) {
      editWelfareBanners.value = res.data.banners.map(function(b) { return { ...b } })
    } else {
      editWelfareBanners.value = defaultWelfareBanners.map(function(b) { return { ...b } })
    }
  } else {
    editServices.value = defaultServices.map(function(s) { return { ...s } })
    editWelfareBanners.value = defaultWelfareBanners.map(function(b) { return { ...b } })
  }
  var tbRes = await callCloud('admin', 'getTabBarConfig')
  if (tbRes.code === 0 && tbRes.data && tbRes.data.tabs && tbRes.data.tabs.length) {
    editTabItems.value = tbRes.data.tabs.map(function(t) { return { ...t } })
  }
}
const addService = () => {
  editServices.value.push({ iconUrl: '', text: '', desc: '', url: '', gradient: 'linear-gradient(135deg, #4299E1, #2B6CB0)' })
}
const removeService = (i) => { editServices.value.splice(i, 1) }
const addWelfareBanner = () => editWelfareBanners.value.push({ imageUrl: '', title: '', desc: '', bg: 'linear-gradient(135deg, #4299E1, #2B6CB0)' })
const removeWelfareBanner = (i) => editWelfareBanners.value.splice(i, 1)
const uploadWelfareBannerImage = (idx) => {
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: function(chooseRes) {
      var tempPath = chooseRes.tempFilePaths[0]
      uni.showLoading({ title: '上传中' })
      var cloudPath = 'banners/welfare_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '.png'
      wx.cloud.uploadFile({
        cloudPath: cloudPath, filePath: tempPath,
        success: function(upRes) {
          editWelfareBanners.value[idx].imageUrl = upRes.fileID
          uni.hideLoading()
          uni.showToast({ title: '上传成功', icon: 'success' })
        },
        fail: function() { uni.hideLoading(); uni.showToast({ title: '上传失败', icon: 'none' }) }
      })
    }
  })
}
const uploadServiceIcon = (idx) => {
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: function(chooseRes) {
      var tempPath = chooseRes.tempFilePaths[0]
      uni.showLoading({ title: '上传中' })
      var cloudPath = 'icons/service_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6) + '.png'
      wx.cloud.uploadFile({
        cloudPath: cloudPath, filePath: tempPath,
        success: function(upRes) {
          editServices.value[idx].iconUrl = upRes.fileID
          uni.hideLoading()
          uni.showToast({ title: '上传成功', icon: 'success' })
        },
        fail: function() { uni.hideLoading(); uni.showToast({ title: '上传失败', icon: 'none' }) }
      })
    }
  })
}
const uploadTabIcon = (idx, type) => {
  uni.chooseImage({
    count: 1, sizeType: ['compressed'], sourceType: ['album', 'camera'],
    success: function(chooseRes) {
      var tempPath = chooseRes.tempFilePaths[0]
      uni.showLoading({ title: '上传中' })
      var suffix = type === 'selected' ? '_active' : ''
      var cloudPath = 'icons/tab_' + idx + suffix + '_' + Date.now() + '.png'
      wx.cloud.uploadFile({
        cloudPath: cloudPath, filePath: tempPath,
        success: function(upRes) {
          if (type === 'selected') {
            editTabItems.value[idx].selectedIconUrl = upRes.fileID
          } else {
            editTabItems.value[idx].iconUrl = upRes.fileID
          }
          uni.hideLoading()
          uni.showToast({ title: '上传成功', icon: 'success' })
        },
        fail: function() { uni.hideLoading(); uni.showToast({ title: '上传失败', icon: 'none' }) }
      })
    }
  })
}
const saveWelfareConfig = async () => {
  uni.showLoading({ title: '保存中' })
  var res = await callCloud('admin', 'saveWelfareConfig', { services: editServices.value, banners: editWelfareBanners.value })
  uni.hideLoading()
  if (res.code === 0) uni.showToast({ title: '保存成功', icon: 'success' })
  else uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
}
const saveTabBarConfig = async () => {
  uni.showLoading({ title: '保存中' })
  var res = await callCloud('admin', 'saveTabBarConfig', { tabs: editTabItems.value })
  uni.hideLoading()
  if (res.code === 0) uni.showToast({ title: '保存成功，重启小程序生效', icon: 'none' })
  else uni.showToast({ title: res.msg || '保存失败', icon: 'none' })
}
// ========== 图标管理结束 ==========
const newAdminPhone = ref('')
const newAdminName = ref('')
const noticeTitle = ref('')
const noticeContent = ref('')
const loadAdmins = async () => { var res = await callCloud('admin', 'adminList'); if (res.code === 0) adminList.value = res.data || [] }
const addAdmin = async () => {
  if (!newAdminPhone.value) { uni.showToast({ title: '请输入手机号', icon: 'none' }); return }
  uni.showLoading({ title: '添加中' })
  var res = await callCloud('admin', 'addAdmin', { phone: newAdminPhone.value, name: newAdminName.value })
  uni.hideLoading()
  if (res.code === 0) { uni.showToast({ title: '添加成功', icon: 'success' }); newAdminPhone.value = ''; newAdminName.value = ''; loadAdmins() }
}
const removeAdmin = (a) => {
  uni.showModal({ title: '确认移除', content: '确定移除管理员 ' + (a.name || a.phone) + '？', success: async (r) => {
    if (r.confirm) { var res = await callCloud('admin', 'removeAdmin', { adminId: a._id }); if (res.code === 0) { uni.showToast({ title: '已移除', icon: 'success' }); loadAdmins() } }
  }})
}
const sendNotice = async () => {
  if (!noticeTitle.value || !noticeContent.value) { uni.showToast({ title: '请填写标题和内容', icon: 'none' }); return }
  uni.showModal({ title: '确认发送', content: '将发送公告给所有用户', success: async (r) => {
    if (r.confirm) { uni.showLoading({ title: '发送中' }); var res = await callCloud('admin', 'sendNotice', { title: noticeTitle.value, content: noticeContent.value }); uni.hideLoading(); if (res.code === 0) { uni.showToast({ title: res.msg || '发送成功', icon: 'success' }); noticeTitle.value = ''; noticeContent.value = '' } }
  }})
}
// ========== 考研资料管理 ==========
const graduateResources = ref([])
const resourceCategories = ['英语', '数学', '政治', '专业课', '综合']
const newResource = reactive({ title: '', desc: '', category: '综合', size: '', link: '', password: '', emoji: '📘', color: 'linear-gradient(135deg, #63B3ED, #2B6CB0)' })
const onPickCategory = (e) => { newResource.category = resourceCategories[e.detail.value] }
const loadGraduateResources = async () => {
  var res = await callCloud('admin', 'resourceList')
  if (res.code === 0) graduateResources.value = res.data || []
}
const addGraduateResource = async () => {
  if (!newResource.title) { uni.showToast({ title: '请输入标题', icon: 'none' }); return }
  if (!newResource.link) { uni.showToast({ title: '请输入网盘链接', icon: 'none' }); return }
  uni.showLoading({ title: '添加中' })
  var res = await callCloud('admin', 'addResource', { ...newResource })
  uni.hideLoading()
  if (res.code === 0) {
    uni.showToast({ title: '添加成功', icon: 'success' })
    newResource.title = ''; newResource.desc = ''; newResource.category = '综合'
    newResource.size = ''; newResource.link = ''; newResource.password = ''
    newResource.emoji = '📘'; newResource.color = 'linear-gradient(135deg, #63B3ED, #2B6CB0)'
    loadGraduateResources()
  }
}
const toggleGraduateStatus = async (gr) => {
  var newStatus = gr.status === 1 ? 0 : 1
  await callCloud('admin', 'updateResource', { resourceId: gr._id, status: newStatus })
  uni.showToast({ title: newStatus === 1 ? '已上架' : '已下架', icon: 'success' })
  loadGraduateResources()
}
const deleteGraduateResource = (gr) => {
  uni.showModal({ title: '确认删除', content: '删除资料 ' + gr.title + '？', success: async (r) => {
    if (r.confirm) { await callCloud('admin', 'deleteResource', { resourceId: gr._id }); uni.showToast({ title: '已删除', icon: 'success' }); loadGraduateResources() }
  }})
}

// ========== 外卖管理 ==========
const foodTab = ref('shops')
const foodShops = ref([])
const foodItems = ref([])
const foodOrders = ref([])
const foodOrderHasMore = ref(false)
const foodOrderStatus = ref(-1)
var foodOrderPage = 1
const selectedShop = ref(null)
const foodStatusMap = { 0: '待确认', 1: '制作中', 2: '配送中', 3: '已完成', 4: '已取消' }
const getFoodStatusText = (fo) => {
  if (fo.status === 2) return fo.deliveryMode === 'self_pickup' ? '待自取' : '配送中'
  return foodStatusMap[fo.status] || '未知'
}
const getFoodNextAction = (fo) => {
  if (fo.status === 0) return '确认订单'
  if (fo.status === 1) return fo.deliveryMode === 'self_pickup' ? '标记待自取' : '标记配送中'
  if (fo.status === 2) return '标记完成'
  return ''
}
const newShop = reactive({ name: '', category: '快餐', phone: '', address: '', deliveryFee: '', minOrder: '', printerSn: '', openTime: '08:00', closeTime: '22:00' })
const newItem = reactive({ name: '', price: '', category: '热销', desc: '' })
const printerCfg = reactive({ user: '', ukey: '', defaultSn: '' })

const loadFoodShops = async () => {
  var res = await callCloud('food', 'adminShopList')
  if (res.code === 0) foodShops.value = res.data || []
}
const addFoodShop = async () => {
  if (!newShop.name) { uni.showToast({ title: '请输入商家名称', icon: 'none' }); return }
  uni.showLoading({ title: '添加中' })
  var res = await callCloud('food', 'addShop', { ...newShop })
  uni.hideLoading()
  if (res.code === 0) { uni.showToast({ title: '添加成功', icon: 'success' }); newShop.name = ''; newShop.phone = ''; newShop.address = ''; newShop.printerSn = ''; loadFoodShops() }
}
const toggleShopStatus = async (s) => {
  var ns = s.status === 1 ? 0 : 1
  await callCloud('food', 'updateShop', { shopId: s._id, status: ns })
  uni.showToast({ title: ns === 1 ? '已开业' : '已休息', icon: 'success' })
  loadFoodShops()
}
const deleteFoodShop = (s) => {
  uni.showModal({ title: '确认删除', content: '删除商家 ' + s.name + ' 及其所有菜品？', success: async (r) => {
    if (r.confirm) { await callCloud('food', 'deleteShop', { shopId: s._id }); uni.showToast({ title: '已删除', icon: 'success' }); loadFoodShops() }
  }})
}
const editShopItems = (s) => { selectedShop.value = s; foodTab.value = 'items'; loadFoodItems() }
const onPickShop = (e) => { selectedShop.value = foodShops.value[e.detail.value]; loadFoodItems() }
const loadFoodItems = async () => {
  if (!selectedShop.value) return
  var res = await callCloud('food', 'adminItemList', { shopId: selectedShop.value._id })
  if (res.code === 0) foodItems.value = res.data || []
}
const addFoodItem = async () => {
  if (!newItem.name) { uni.showToast({ title: '请输入菜品名称', icon: 'none' }); return }
  uni.showLoading({ title: '添加中' })
  var res = await callCloud('food', 'addItem', { shopId: selectedShop.value._id, ...newItem })
  uni.hideLoading()
  if (res.code === 0) { uni.showToast({ title: '添加成功', icon: 'success' }); newItem.name = ''; newItem.price = ''; newItem.desc = ''; loadFoodItems() }
}
const toggleItemStatus = async (fi) => {
  var ns = fi.status === 1 ? 0 : 1
  await callCloud('food', 'updateItem', { itemId: fi._id, status: ns })
  uni.showToast({ title: ns === 1 ? '已上架' : '已下架', icon: 'success' })
  loadFoodItems()
}
const deleteFoodItem = (fi) => {
  uni.showModal({ title: '确认删除', content: '删除菜品 ' + fi.name + '？', success: async (r) => {
    if (r.confirm) { await callCloud('food', 'deleteItem', { itemId: fi._id }); uni.showToast({ title: '已删除', icon: 'success' }); loadFoodItems() }
  }})
}
const loadFoodOrders = async () => {
  var params = { page: foodOrderPage, pageSize: 20 }
  if (foodOrderStatus.value !== -1) params.status = foodOrderStatus.value
  var res = await callCloud('food', 'adminOrderList', params)
  if (res.code === 0) { foodOrders.value = res.data || []; foodOrderHasMore.value = (res.data || []).length >= 20 }
}
const advanceFoodOrder = async (fo) => {
  var nextStatus = fo.status + 1
  if (nextStatus > 3) return
  await callCloud('food', 'updateOrderStatus', { orderId: fo._id, status: nextStatus })
  uni.showToast({ title: getFoodStatusText({ ...fo, status: nextStatus }), icon: 'success' })
  loadFoodOrders()
}
const cancelFoodOrder = (fo) => {
  uni.showModal({ title: '确认取消', content: '取消该外卖订单？', success: async (r) => {
    if (r.confirm) { await callCloud('food', 'updateOrderStatus', { orderId: fo._id, status: 4 }); uni.showToast({ title: '已取消', icon: 'success' }); loadFoodOrders() }
  }})
}
const reprintOrder = async (fo) => {
  uni.showLoading({ title: '打印中' })
  var res = await callCloud('food', 'reprintOrder', { orderId: fo._id })
  uni.hideLoading()
  if (res.code === 0 && res.data && res.data.success) uni.showToast({ title: '打印成功', icon: 'success' })
  else uni.showToast({ title: (res.data && res.data.msg) || res.msg || '打印失败', icon: 'none' })
}
const loadPrinterConfig = async () => {
  var res = await callCloud('food', 'getPrinterConfig')
  if (res.code === 0 && res.data) { printerCfg.user = res.data.user || ''; printerCfg.ukey = res.data.ukey || ''; printerCfg.defaultSn = res.data.defaultSn || '' }
}
const savePrinterConfig = async () => {
  uni.showLoading({ title: '保存中' })
  var res = await callCloud('food', 'savePrinterConfig', { user: printerCfg.user, ukey: printerCfg.ukey, defaultSn: printerCfg.defaultSn })
  uni.hideLoading()
  if (res.code === 0) uni.showToast({ title: '保存成功', icon: 'success' })
}

// ========== 洗鞋团购管理 ==========
const washTab = ref('products')
const washProducts = ref([])
const washOrders = ref([])
const washOrderHasMore = ref(false)
const washOrderStatus = ref(-1)
var washOrderPage = 1
const washStatusMap = { 0: '待处理', 1: '处理中', 2: '已完成', 3: '已取消' }
const getWashStatusText = (wo) => washStatusMap[wo.status] || '未知'
const newWash = reactive({ name: '', desc: '', originalPrice: '', groupPrice: '', groupSize: '3' })
const loadWashProducts = async () => {
  var res = await callCloud('admin', 'washProductList')
  if (res.code === 0) washProducts.value = res.data || []
}
const addWashProduct = async () => {
  if (!newWash.name) { uni.showToast({ title: '请输入商品名', icon: 'none' }); return }
  uni.showLoading({ title: '添加中' })
  var res = await callCloud('admin', 'addWashProduct', {
    name: newWash.name, desc: newWash.desc,
    originalPrice: newWash.originalPrice, groupPrice: newWash.groupPrice,
    groupSize: newWash.groupSize
  })
  uni.hideLoading()
  if (res.code === 0) {
    uni.showToast({ title: '添加成功', icon: 'success' })
    newWash.name = ''; newWash.desc = ''; newWash.originalPrice = ''; newWash.groupPrice = ''; newWash.groupSize = '3'
    loadWashProducts()
  }
}
const toggleWashStatus = async (wp) => {
  var newStatus = wp.status === 1 ? 0 : 1
  await callCloud('admin', 'updateWashProduct', { productId: wp._id, status: newStatus })
  uni.showToast({ title: newStatus === 1 ? '已上架' : '已下架', icon: 'success' })
  loadWashProducts()
}
const deleteWashProduct = (wp) => {
  uni.showModal({ title: '确认删除', content: '删除商品 ' + wp.name + '？', success: async (r) => {
    if (r.confirm) { await callCloud('admin', 'deleteWashProduct', { productId: wp._id }); uni.showToast({ title: '已删除', icon: 'success' }); loadWashProducts() }
  }})
}
const loadWashOrders = async () => {
  var params = { page: washOrderPage, pageSize: 20 }
  if (washOrderStatus.value !== -1) params.status = washOrderStatus.value
  var res = await callCloud('wash', 'adminOrderList', params)
  if (res.code === 0) { washOrders.value = res.data || []; washOrderHasMore.value = (res.data || []).length >= 20 }
}
const advanceWashOrder = async (wo) => {
  var nextStatus = wo.status + 1
  if (nextStatus > 2) return
  await callCloud('wash', 'updateOrderStatus', { orderId: wo._id, status: nextStatus })
  uni.showToast({ title: washStatusMap[nextStatus] || '已更新', icon: 'success' })
  loadWashOrders()
}
const cancelWashOrder = (wo) => {
  uni.showModal({ title: '确认取消', content: '取消该洗护订单？', success: async (r) => {
    if (r.confirm) { await callCloud('wash', 'updateOrderStatus', { orderId: wo._id, status: 3 }); uni.showToast({ title: '已取消', icon: 'success' }); loadWashOrders() }
  }})
}

const fmtDate = (t) => { if (!t) return ''; var d = new Date(t); return (d.getMonth()+1) + '/' + d.getDate() + ' ' + String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') }
onLoad(() => { loadDashboard() })
</script>

<style scoped>
.admin-page { background: #F0F2F5; min-height: 100vh; }
.admin-header { background: linear-gradient(160deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%); padding: 60rpx 32rpx 28rpx; }
.admin-title { font-size: 36rpx; font-weight: 800; color: #fff; }
.tab-bar { display: flex; background: #fff; padding: 0 8rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06); }
.tab-item { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 16rpx 0 12rpx; position: relative; }
.tab-item.active { color: #2B6CB0; }
.tab-item.active::after { content: ''; position: absolute; bottom: 0; left: 25%; right: 25%; height: 4rpx; background: #2B6CB0; border-radius: 2rpx; }
.tab-icon { font-size: 28rpx; }
.tab-label { font-size: 20rpx; color: #718096; margin-top: 4rpx; }
.tab-item.active .tab-label { color: #2B6CB0; font-weight: 700; }
.main-scroll { height: calc(100vh - 200rpx); }
.section { padding: 24rpx; }
.card-title { font-size: 30rpx; font-weight: 700; color: #1A1A2E; margin-bottom: 20rpx; }
.card-title-sub { font-size: 28rpx; font-weight: 600; color: #4A5568; margin-bottom: 16rpx; }
.stats-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.s-card { width: calc(50% - 8rpx); background: #fff; border-radius: 16rpx; padding: 24rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.04); }
.s-num { font-size: 40rpx; font-weight: 800; display: block; }
.s-label { font-size: 22rpx; color: #A0AEC0; margin-top: 4rpx; display: block; }
.form-row { display: flex; align-items: center; margin-bottom: 16rpx; background: #fff; border-radius: 12rpx; padding: 16rpx 20rpx; }
.form-lbl { font-size: 26rpx; color: #4A5568; width: 140rpx; flex-shrink: 0; }
.form-ipt { flex: 1; font-size: 26rpx; color: #2D3748; }
.form-textarea { flex: 1; font-size: 26rpx; color: #2D3748; height: 160rpx; }
.btn-primary { background: linear-gradient(135deg, #4299E1, #2B6CB0); color: #fff; text-align: center; padding: 20rpx; border-radius: 12rpx; margin-top: 16rpx; }
.btn-primary text { color: #fff; font-size: 28rpx; font-weight: 600; }
.btn-outline { border: 2rpx dashed #CBD5E0; text-align: center; padding: 20rpx; border-radius: 12rpx; margin-top: 16rpx; }
.btn-outline text { color: #718096; font-size: 26rpx; }
.search-row { display: flex; gap: 12rpx; margin-bottom: 20rpx; }
.search-ipt { flex: 1; background: #fff; border-radius: 12rpx; padding: 0 20rpx; font-size: 26rpx; min-width: 0; height: 72rpx; line-height: 72rpx; }
.btn-sm { background: #2B6CB0; color: #fff; padding: 0 20rpx; border-radius: 12rpx; flex-shrink: 0; height: 72rpx; line-height: 72rpx; }
.btn-sm text { color: #fff; font-size: 26rpx; }
.chip-row { display: flex; gap: 12rpx; margin-bottom: 16rpx; flex-wrap: wrap; }
.chip { padding: 10rpx 24rpx; background: #fff; border-radius: 24rpx; font-size: 24rpx; color: #718096; border: 2rpx solid #E2E8F0; }
.chip.active { background: #EBF4FF; color: #2B6CB0; border-color: #2B6CB0; font-weight: 600; }
.chip.sm { padding: 6rpx 18rpx; font-size: 22rpx; }
.list-item { display: flex; align-items: center; background: #fff; border-radius: 14rpx; padding: 20rpx 24rpx; margin-bottom: 12rpx; box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.04); }
.li-body { flex: 1; }
.li-top { display: flex; align-items: center; gap: 10rpx; }
.li-name { font-size: 28rpx; font-weight: 600; color: #2D3748; }
.li-badge { font-size: 20rpx; padding: 2rpx 12rpx; border-radius: 8rpx; background: #EBF4FF; color: #2B6CB0; }
.li-badge.green { background: #F0FFF4; color: #38A169; }
.li-badge.red { background: #FFF5F5; color: #E53E3E; }
.li-badge.st0 { background: #FFFAF0; color: #DD6B20; }
.li-badge.st1 { background: #EBF4FF; color: #2B6CB0; }
.li-badge.st2 { background: #F0FFF4; color: #38A169; }
.li-badge.st3 { background: #F7FAFC; color: #A0AEC0; }
.li-sub { font-size: 24rpx; color: #A0AEC0; margin-top: 6rpx; display: block; }
.li-arrow { font-size: 32rpx; color: #CBD5E0; }
.li-acts { display: flex; gap: 16rpx; align-items: center; }
.act-red { font-size: 24rpx; color: #E53E3E; font-weight: 600; padding: 8rpx 16rpx; }
.act-green { font-size: 24rpx; color: #38A169; font-weight: 600; padding: 8rpx 16rpx; }
.li-badge.wd0 { background: #FFFAF0; color: #DD6B20; }
.li-badge.wd1 { background: #F0FFF4; color: #38A169; }
.li-badge.wd2 { background: #FFF5F5; color: #E53E3E; }
.empty { padding: 60rpx 0; text-align: center; }
.empty text { font-size: 26rpx; color: #A0AEC0; }
.load-more { text-align: center; padding: 20rpx; }
.load-more text { font-size: 26rpx; color: #2B6CB0; }
.banner-edit { background: #fff; border-radius: 14rpx; padding: 20rpx; margin-bottom: 16rpx; box-shadow: 0 1rpx 4rpx rgba(0,0,0,0.04); }
.be-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12rpx; }
.be-idx { font-size: 26rpx; font-weight: 600; color: #4A5568; }
.mt { margin-top: 32rpx; }
.icon-tip { background: #FFFFF0; border: 2rpx solid #FEFCBF; border-radius: 12rpx; padding: 16rpx 20rpx; margin-bottom: 20rpx; }
.icon-tip text { font-size: 24rpx; color: #975A16; }
.icon-pick-row { flex: 1; display: flex; align-items: center; gap: 12rpx; }
.form-ipt-short { width: 160rpx; font-size: 26rpx; color: #2D3748; }
.icon-or text { font-size: 24rpx; color: #A0AEC0; }
.btn-upload-sm { background: #EBF4FF; padding: 8rpx 20rpx; border-radius: 8rpx; }
.btn-upload-sm text { font-size: 24rpx; color: #2B6CB0; font-weight: 600; }
.icon-preview-row { display: flex; align-items: center; gap: 16rpx; padding: 12rpx 20rpx; background: #F7FAFC; border-radius: 10rpx; margin-bottom: 12rpx; }
.icon-preview-img { width: 64rpx; height: 64rpx; border-radius: 10rpx; }
.banner-preview-img { width: 400rpx; height: 160rpx; border-radius: 10rpx; }
.tab-icon-row { display: flex; gap: 24rpx; padding: 12rpx 0; }
.tab-icon-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12rpx; }
.tab-icon-label { font-size: 24rpx; color: #4A5568; font-weight: 600; }
.tab-icon-preview { width: 80rpx; height: 80rpx; border-radius: 12rpx; background: #F7FAFC; }
.tab-icon-placeholder { width: 80rpx; height: 80rpx; border-radius: 12rpx; background: #EDF2F7; display: flex; align-items: center; justify-content: center; }
.tab-icon-placeholder text { font-size: 20rpx; color: #A0AEC0; }
</style>