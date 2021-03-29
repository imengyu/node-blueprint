<template>
  <div class="help-view fill-absolute">
    <h1>欢迎使用 NODE Blueprint</h1>
    <h4>这是什么东西</h4>
    <p>这是一个一个类似(抄袭)于Unreal engine 蓝图的脚本的一个设计软件， 基于HTML和JS，你可以将一些复杂的、功能性强的代码封装为可重复调用的一个个功能单元，用简单易懂的流程脚本蓝图来组织、调用他们，可实现用流程蓝图来控制程序的运行。</p>
    <p>说的直白一些，这就是一个可视化编程的一个软件，它基于Web和Javascript，你可以直接在浏览器里编程。不过目前可能会出现BUG，毕竟它还没有开发完全，所以还是先随心所欲的玩玩好了，不要拿来当作生产工具哦。。</p>
    <h4>怎么玩？</h4>

    <a href="https://github.com/imengyu/node-blueprint#%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95" target="_blank">查看使用方法</a><br>


    <h4>还可以嘛</h4>
    <p>如果你对这个项目感兴趣，或者说想用在自己的项目中，又或者是想要提点意见，欢迎访问项目 Github 哦。我会虚心接受您的宝贵意见。</p>
    <p>如果你想把这个项目用到其他地方，发挥它的不曾发现的功能，欢迎联系我哦，我们可以一起把它做得更好。</p>
    <p class="github-buttons-to">
      <a href="https://github.com/imengyu/node-blueprint" target="_blank">
        <img src="../assets/images/GitHub.svg" /> 
        <span>
          Github<br>
          访问项目主页
        </span>
      </a>
    </p>

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

@Component({
  name: 'HelpView'
})
export default class HelpView extends Vue {

}
</script>

<style lang="scss">
@import '../assets/sass/scroll.scss';

.github-buttons-to {
  border-radius: 5px;
  background-color: #fff;
  padding: 4px 8px;
  display: inline-block;

  img {
    display: inline-block;
    margin-right: 6px;
    width: 30px;
    height: 30px;
  }
  a {
    display: inline-flex;
    justify-content: center;
    align-items: center;

    span {
      display: inline-block;
    }
  }
}

.help-view {
  padding: 10px;
  color: #b1b1b1;
  overflow: hidden;
  overflow-y: scroll;

  @include pc-fix-scrollbar();

  h1 {
  color: #ffffff;
  }
  h4 {
    color: #e7e7e7;
  }
}
</style>