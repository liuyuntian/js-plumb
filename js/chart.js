var vm = new Vue({
  el: "#app",
  template: '<div id="drawDiv" @mousemove="moveMouse($event)" style="height: 100%;">' +
    '        <div>' +
    '            <el-button type="primary" @click="saveChange">保 存</el-button>' +
    '        </div>' +
    '        <div class="panel-body points demo flow_chart" id="points" style="height: 80%; width: 80%">' +
    '          <div v-for="(val, point) in data.formMap" :id="point" class="point" :style="calPosition(point, val)">' +
    '            <div :id="`drag-${point}`" style="padding:0 0.5em; background: #409EFF; cursor: default; display: flex; justify-content: space-between"><span class="name-change" style="font-size: 12px;">{{val.name}}</span></div>' +
    '            <div class="add-content">' +
    '              <div v-for="(val1, m) in val.fieldMap" title="拖动可以进行连线" style="color:black; border-top: 1px solid #cccccc;display: flex;padding: 0 0.8em; justify-content: space-between" :id="point + \'-\' + m"><div class="param-name" style="font-size: 12px">{{val1.name}}</div></div>' +
    '            </div>' +
    '          </div>' +
    '        </div>' +
    '        <el-dialog' +
    '                title="关联设置"' +
    '                :visible.sync="editVisible"' +
    '                width="30%">' +
    '            <el-form v-if="tableForm" ref="tableForm" :model="tableForm" label-width="100">' +
    '                <el-form-item prop="name" label="子表名：">' +
    '                    <el-input v-model="data.formMap[tableForm.formId].name" readonly/>' +
    '                </el-form-item>' +
    '                <el-form-item prop="code" label="子表明关联字段">' +
    '                  <el-input v-model="data.formMap[tableForm.formId].fieldMap[tableForm.fieldId].name" readonly/>' +
    '                </el-form-item>' +
    '              <el-form-item prop="name" label="父表名：">' +
    '                <el-input v-model="data.formMap[tableForm.targetFormId].name" readonly/>' +
    '              </el-form-item>' +
    '              <el-form-item prop="code" label="父表关联字段">' +
    '                <el-input v-model="data.formMap[tableForm.targetFormId].fieldMap[tableForm.targetFieldId].name" readonly/>' +
    '              </el-form-item>' +
    '              <el-form-item prop="code" label="父表关联显示字段">' +
    '                <el-select style="width: 100%" v-model="tableForm.targetDisplayFieldId" @change="changeSelect">' +
    '                  <el-option v-for="(val, key) in data.formMap[tableForm.targetFormId].fieldMap" :key="key" :value="val.id" :label="val.name"></el-option>' +
    '                </el-select>' +
    '              </el-form-item>' +
    '            </el-form>' +
    '            <div slot="footer" class="dialog-footer">' +
    '                <el-button @click="editCancel">取 消</el-button>' +
    '                <el-button type="danger" @click="deleteConnection">删 除</el-button>' +
    '                <el-button type="primary" @click="tableChange">确 定</el-button>' +
    '            </div>' +
    '        </el-dialog>' +
    '    </div>',
  data: {
    overlay: null,
    newElements: null,
    newNodeEvent: null,
    isDragging: false,
    instance: {},
    tableForm: null,
    currentItem: 0,
    currentConn: null,
    editVisible: false,
    dialogVisible: false,
    data: {
      formIds: [],//表单的id列表
      formMap: { //以表单的id作为key的表单Map结构
        1: {
          name: '表单一',
          fieldIds: [1, 2],//字段id列表
          fieldMap: {//以字段id为key的字段map
            1: {
              id: 1, //字段id
              bizId: 'column1',//业务id，表字段名
              name: '表一第一列',//字段中文名
              otherAttrs: { //其它属性中
                targetLines: [{ // 连线都放到起点节点上，数组json结构存储,目标节点连线,支持多个
                  lineId: '1_1_2_2_1',// 联系id规则 ${formId}_${fieldId}_${targetFormId}_${targetFieldId}_${lineType};
                  lineType: 1,// 连线类型 1.关联;2.推送
                  //连线规则1：起点是本表字段，终点是他表字段，箭头都指向他表
                  //联系规则2：关联连线用实线，推送连线用虚线，连线颜色和样式进行区分
                  formId: 1,//本表表单id
                  fieldId: 1,//本表字段id
                  targetFormId: 2,//目标表单id
                  targetFieldId: 2,//目标字段id
                  targetDisplayFieldId: null
                }],
              }
            },
            2: {
              id: 1, //字段id
              bizId: 'column2',//业务id，表字段名
              name: '表一第二列',//字段中文名
              otherAttrs: { //其它属性中
                targetLines: []
              }
            },
          },
        },
        2: {
          name: '表单二',
          fieldIds: [1, 2],//字段id列表
          fieldMap: {//以字段id为key的字段map
            1: {
              id: 1, //字段id
              bizId: 'column1',//业务id，表字段名
              name: '第二表第一列',//字段中文名
              otherAttrs: {
                targetLines: []
              }
            },
            2: {
              id: 2, //字段id
              bizId: 'column2',//业务id，表字段名
              name: '第二表第二列',//字段中文名
              otherAttrs: { //其它属性中
                targetLines: []
              }
            },
          },
        },
      },
      lineIds: [],//联系id列表,所有字段连线,规则为 ${formId}_${fieldId}_${targetFormId}_${targetFieldId}_${lineType}
    }
  },
  created(){
    // 请求数据
    console.log(this.data)
  },
  mounted(){
    jsPlumb.ready(() => {
      this.createFlow(this.data);
    });
  },
  methods: {
    // 没有坐标生成1000 X 500 的随机坐标
    calPosition(point, val){
      if (val.x && val.y){
        return { left: val.x + '%', top: val.y + '%' }
      }else{
        let randomX = Math.ceil(Math.random() * 100);
        let randomY = Math.ceil(Math.random() * 90)
        this.data.formMap[point].x = randomX;
        this.data.formMap[point].y = randomY;
        return { left: randomX + '%', top: randomY + '%' }
      }
    },
    changeSelect(e){
      console.log(this.tableForm.targetDisplayFieldId);
      console.log(this.data.formMap[this.tableForm.targetFormId].fieldMap);
    },
    editCancel(){
      this.editVisible = false;
      this.tableForm = null;
    },
    tableChange(){
      // 保存修改后连线
      this.editVisible = false;
      console.log(this.data);
    },
    cancel(){
      this.dialogVisible = false;
    },
    moveMouse(event){
      if (this.isDragging === true){
        this.newElements.style.left = event.offsetX;
        this.newElements.style.top = event.offsetY;
        console.log(event.offsetX + ',' + event.offsetY);
      }
    },
    refresh(){
    },
    // 增加字段项
    editTable(conn){
      let vm = this;
      vm.editVisible = true;
      vm.currentConn = conn;
      vm.data.formMap[conn.sourceId.split('-')[0]].fieldMap[conn.sourceId.split('-')[1]].otherAttrs.targetLines.forEach(element => {
        if (element.targetFormId == conn.targetId.split('-')[0] && element.targetFieldId == conn.targetId.split('-')[1]){
          vm.currentItem = vm.data.formMap[conn.sourceId.split('-')[0]].fieldMap[conn.sourceId.split('-')[1]].otherAttrs.targetLines.indexOf(element);
          vm.tableForm = element
        }
      })
    },
    deleteConnection(){
      let vm = this;
      vm.instance.deleteConnection(vm.currentConn);
      if (vm.data.formMap[vm.currentConn.sourceId.split('-')[0]].fieldMap[vm.currentConn.sourceId.split('-')[1]].otherAttrs.targetLines.splice(vm.currentItem, 1)){
        vm.editVisible = false;
        this.$message({
          message: '删除成功，请先保存，否则刷新页面后无效',
          type: 'success'
        });
      }else{
        this.$message({
          message: '删除错误',
          type: 'error'
        });
      }

    },
    saveChange(){
      console.log(this.data)
    },
    createFlow(){
      let vm = this;
      const color = '#409EFF';
      window.s = vm.instance = jsPlumb.getInstance({
        // notice the 'curviness' argument to this Bezier curve.
        // the curves on this page are far smoother
        // than the curves on the first demo, which use the default curviness value.
        // Connector: ['Flowchart', { curviness: 50 }],
        DragOptions: { cursor: 'pointer', zIndex: 5000 },
        PaintStyle: { lineWidth: 5, stroke: color },
        HoverPaintStyle: { stroke: '#66b1ff', lineWidth: 4 },
        EndpointHoverStyle: { fill: '#66b1ff', stroke: '#66b1ff' },
        deleteEndpointsOnDetach: false,
        Container: 'points',
        Endpoint: ['Dot', { radius: 12 }],
        EndpointStyle: {
          stroke: "#aaa",
          fill: "#F2F2F2",
          radius: 3,
          strokeWidth: 1
        },
        ConnectionOverlays: [
          [
            "Arrow",
            {
              location: 1,
              visible: true,
              width: 11,
              length: 11,
              id: "ARROW",
            }
          ]]
      });
      // suspend drawing and initialise.
      vm.instance.batch(() => {
        // init point
        for (const point in vm.data.formMap){
          for (const m in vm.data.formMap[point].fieldMap){
            vm.instance.makeSource(point + '-' + m, {
              anchor: [ "Continuous", { faces:["left","right"] }],
              endpoint: 'Dot',
              maxConnections: 1,
            });
            vm.instance.makeTarget(point + '-' + m, {
              anchor: [ "Continuous", { faces:["left","right"] }],
              allowLoopback: false
            });
          }
          vm.instance.draggable(`${point}`, {
            containment: 'points',
            // 拖拽后改变位置
            stop: function (e){
              console.log(e.el)
              vm.data.formMap[e.el.id].x = e.pos[0];
              vm.data.formMap[e.el.id].y = e.pos[1];
              console.log(vm.data.formMap)
            }
          });
        }
        // init transition
        for (const i in vm.data.formMap){
          // 有关系表
          for (const p in vm.data.formMap[i].fieldMap){
            let targetLines = vm.data.formMap[i].fieldMap[p].otherAttrs.targetLines;
            if (targetLines && targetLines.length > 0){
              for (const line in targetLines){
                vm.instance.connect({
                  source: targetLines[line].formId + '-' + targetLines[line].fieldId,
                  target: targetLines[line].targetFormId + '-' + targetLines[line].targetFieldId
                });
              }
            }
          }
        }
        vm.instance.bind('click', function (conn, originalEvent){
          vm.editTable(conn);
        });
        vm.instance.bind("connection", function (connInfo, originalEvent){
          let lineAttr = {
            lineId: (connInfo.connection.sourceId + '_' + connInfo.connection.targetId + '_1').replace(/-/g, '_'),
            lineType: connInfo.connection.sourceId.split('-')[0],
            formId: parseInt(connInfo.connection.sourceId.split('-')[0]),
            fieldId: parseInt(connInfo.connection.sourceId.split('-')[1]),
            targetFormId: parseInt(connInfo.connection.targetId.split('-')[0]),
            targetFieldId: parseInt(connInfo.connection.targetId.split('-')[1]),
            targetDisplayFieldId: null
          }
          vm.data.formMap[connInfo.connection.sourceId.split('-')[0]].fieldMap[connInfo.connection.sourceId.split('-')[1]].otherAttrs.targetLines.push(lineAttr)
          vm.$message({
            message: '连接成功，请保存！！',
            type: 'success'
          });
          console.log(vm.data.formMap)
        });
      });
      vm.instance.fire('jsPlumbDemoLoaded', vm.instance);
    }
  }

});
