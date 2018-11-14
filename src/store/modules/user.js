import { logoOut, getUserType } from '@/api/login'

const user = {
  state: {
    name: '',
    avatar: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIIAAACCCAYAAACKAxD9AAAFbElEQVR4nO3d626jOhiF4YU55qRIvf9L6zVEKkmAgMH7R+0o3Tu7TVqD+ch6pGqkzqj1kLeA3QDR+/u7Ab28BADe3t5Cj4MCOhwOUKEHQfPAEAgAQyCLIRAAhkAWQyAADIEshkAAGAJZDIEAMASyGAIBYAhkMQQCwBDIYggEgCGQxRAIAEMgiyEQAIZAFkMgAAyBLIZAABgCWQyBADAEshgCAWAIZDEEAsAQyGIIBIAhkMUQCABDIIshEACGQBZDIAAMgSyGQAAYAlkMgQAwBLIYAgFgCGQloQcwJa319aPve/R9f/27KIqglIJSCnEcI0kSJEkCpV7jZ2XxIbRti6ZpoLX+9t8ZY65xdF13/Xwcx0jTFHmeI47jsYcbzGJDuFwuqOsawzD86eu4OJqmQZqmKIoCaZp6GuV8LC4ErTXO5/OX3b4vXdeh6zqkaYr1er2oPcSiDoB1XaMsy1EiuNV1HT4+PlDX9ajfZ0qL2CMYY3A6nb4c26dQ1zW01thut4iiaNLv7Zv4PcIwDCjLcvIInK7rUJbln89FQhMdgjEGx+Nx9EPBT/q+x/F4hDFyH5gnOoQ5ROC4GKQSG0JVVT+uDUxNa42qqkIP41dEhuAWiebokcWrORIXgjFm9j915/M59BCeJi4EH6uFY+v7HpfLJfQwniIqBGOMmA0sbbFJVAhN04iZog3DEGxt4zfEhSCJlL0XICiEruvE7A0c7hFG0LZt6CE8zRgjJgYxIUicmwNyxi0iBPfuIYmkjFtECFI25j1Sxi4ihLkvIH1HythFhCBttiARQxiZlLGLCEEyKW9hExHCq1xkEpKILSw5BCljFzFKKRvzHinXPojYwu6aRIkYgmdJIvMSDCnjFhOCxOsNoyhiCL5lWRZ6CE9LkoTTR9+iKBIXQ57noYfwMDEhAEBRFKGH8DCllKhwRYWQJImYcwVJ0QLCQgCA9Xodegg/UkqJOiwAAkOI43j2P23r9VrMSaIjLgQAWK1Ws12oSdNU1LmBIzKEKIpmeXMKpRS2223oYfyKyBCAz0PEZrMJPYyrucb5KLEhAJ+LTHOIwUUgZRXxHrkjt9zZeagrkKMowm63Ex0BsIAQgM8YlFI4nU6TvjUsjmNst9vZnrg+Q/Sh4Vaaptjv95MtOBVFgf1+v4gIgIXsERylFHa7nbe7rt6zxJttAgsLwcnzHFmW4XK5oGkaL0FkWYaiKMSfC/yfZf6v8HkSVxQFiqJA27Zo2/apK6rdewmyLEOWZWKnhY9abAi33IsJfF6CprXGMAzXPYUx5stt+pMkWdyu/ycvEcKtOI5f7kV+xGJmDfQ3DIEAMASyGAIBEHKyOAwD+r6HMeb6cXvGf/un+/ePiKLo7rTQfY97n3/ka95+bTcb+ffDw+Y2HZ1VCG5qd2+KtzRumurWKkJfyRU8hK7rros9S33R7xmG4brQVVUV4jhGnufI8zzI3iJICMMwoGkaXC4XMTeSGFvf96iqCnVdY7VaTf6+zElDMMagrmsG8A139/m2bbHZbCZb/JrswOSejCbpfsohaa1RluVkNxqdJISmaXA8Hl/qHMAH9/S6Ke5BPfqhoaoqcTfTnhv3oJIxzxtG3SM0TcMIPKmqatS7vY8WguQHXc3VWI86BkYKwR3byL+xtusoIfh6exj9l3tyvW/eQzDG8LxgZHVde5+Cew+B6wTjG+MhZ95DkPQcI8lmHYL7jSGNz/2G1hevIUh5ftFS+NzeDEGwWYZgjBHzIKul0Fp7OzH3FoKUZxctja/tzhCEYwgEYIYhcNoYhq/tzhCEYwgEwN9T5LxOH2l6s9sjMATZeO0jAWAI4vnaEycAcDgcvHwxCsPH6/cPmLSZST7RXTMAAAAASUVORK5CYII=',
    roles: [],
    userId: ''
  },

  mutations: {
    SET_NAME: (state, name) => {
      state.name = name
    },
    SET_AVATAR: (state, avatar) => {
      state.avatar = avatar
    },
    SET_ROLES: (state, roles) => {
      state.roles = roles
    },
    SET_USER_ID: (state, userId) => {
      state.userId = userId
    }
  },

  actions: {
    // 登录
    Login() {

    },

    // 获取用户信息
    async GetInfo({ commit, state }) {
      const res = await getUserType()
      if (res && res.state == '0') {
        commit('SET_ROLES', res.user.roles)
        commit('SET_NAME', res.user.name)
        commit('SET_USER_ID', res.user.id)
        commit('SET_AVATAR', `http://dayu.oa.com/avatars/${res.user.name}/avatar.jpg?dpr=1&size=32`)
      }
    },

    // 登出
    async LogOut({ commit, state }) {
      const res = await logoOut()
      if (res.state == 0) {
        this.$message({
          message: '恭喜你，这是一条成功消息',
          type: 'success'
        })
      }
    }
  }
}

export default user
