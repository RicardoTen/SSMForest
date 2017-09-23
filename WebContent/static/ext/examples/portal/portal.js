Ext.Ajax.timeout = 60000;
Ext.Loader.setConfig({
	enabled : true
});
Ext.require([ 'Ext.util.History', 'Ext.ux.statusbar.StatusBar', 'Ext.app.PortalPanel', 'Ext.ux.TabScrollerMenu', 'Ext.state.*', 'Ext.window.MessageBox', 'Ext.tip.*' ]);

var mainTab, globalPageSize = 20, // 全局分页大小
globalDateColumnWidth = 160;// 全局时间列宽度

var flage=true;

Ext.onReady(function() {
	Ext.QuickTips.init();
	Ext.History.init();
	// Ext.state.Manager.setProvider(Ext.create('Ext.ux.custom.HttpProvider'));

	var tokenDelimiter = ':';

	var mainPortal = Ext.create('Ext.app.Home', {
		title : '平面效果图'
	});

	mainTab = Ext.create('Ext.TabPanel', {
		region : 'center',
		margins : '2 0 0 0',
		deferredRender : false,
		activeTab : 0,
		plugins : Ext.create('Ext.ux.TabCloseMenu', {
			closeTabText : '关闭面板',
			closeOthersTabsText : '关闭其他',
			closeAllTabsText : '关闭所有'
		}),
		items : [ mainPortal ],
		listeners : {
			tabchange : onTabChange,
			afterrender : onAfterRender
		}
	});

	
	 Ext.define('MyData',{ 
	        extend: 'Ext.data.Model', 
	        idProperty : 'id',
			fields : [ {
				name : 'id',
				type : 'long'
			}, 'userName', 'password', 'realName', 'tel', 'email', {
				name : 'lastLoginTime',
				type : 'datetime',
				dateFormat : 'Y-m-d H:i:s'
			}, {
				name : 'role',
				type : 'short'
			}, 'roleName' ]
	    }); 
	var notifystore = Ext.create('Ext.data.Store', { 
     //分页大小 
     model: 'MyData', 
     //是否在服务端排序 
		pageSize :11,
		remoteSort : true,
     proxy: { 
         type: 'ajax', 
         url : appBaseUri + '/sys/sysuser/getSysUser',
         extraParams : null,
         reader: { 
         		type : 'json',
					root : 'data',
					totalProperty : 'totalRecord',
					successProperty : "success"
         }
         
     },
     sorters : [ {
			property :'id',
			direction :'RESC'
		} ]
     
 }); 
	this.task={
			run : function(){
				getAlarmNotify();
			},
			interval:20000
	};
	Ext.TaskManager.start(this.task);
	
	var menuTreeStore = Ext.create('Ext.data.TreeStore', {
		autoLoad : true,
		proxy : {
			type : 'ajax',
			url : appBaseUri + '/sys/authority/getAuthority?globalRoleId=' + globalRoleId,
			reader : {
				type : 'json',
				root : 'children'
			}
		}
	/**
	 * <code>
	 proxy : new Ext.data.HttpProxy({
	 	url : appBaseUri + '/static/json/menu.json'
	 })
	 </code>
	 */
	});

//	var treeFilterField = Ext.create('Ext.form.field.Trigger', {
//		width : '100%',
//		emptyText : '功能查找...',
//		trigger1Cls : 'x-form-clear-trigger',
//		hidden:true,
//		onTrigger1Click : function() {
//			treeFilterField.setValue('');
//			menuTreeStore.clearFilter(true);
//		},
//		listeners : {
//			'keyup' : {
//				element : 'el',
//				fn : function(e) {
//					var regex = new RegExp(Ext.String.escapeRegex(treeFilterField.getValue()), 'i');
//					menuTreeStore.clearFilter(true);
//					menuTreeStore.filter(new Ext.util.Filter({
//						filterFn : function(item) {
//							return regex.test(item.get('text'));
//						}
//					}));
//				}
//			}
//		}
//	});

	var treePanel = Ext.create('Ext.tree.Panel', {
		id : 'menuTree',
		region : 'west',
		split : true,
		title : '功能导航',
		width : 220,
		stateId : 'appnav',
		stateful : true,
		margins : '2 0 0 0',
		collapsible : true,
		animCollapse : true,
		xtype : 'treepanel',
		rootVisible : false,
		store : menuTreeStore,
		tbar : [],
		listeners : {
			'itemclick' : function(e, record) {
				if (record.data.leaf) {
					globalObject.openTab(record.data.id, record.data.text, record.raw.url, {
						cButtons : record.raw.buttons ? record.raw.buttons.split(',') : [],
						cName : record.raw.menuCode,
						cParams : record.raw.menuConfig
					});
				}
			}
		}
	});
    this.alarmWindow = Ext.create('Ext.window.Window', {
//    	title : '告警日志情况',
    	id : 'alarmWindowId',
        resizable : false,
    	closable : false,
    	header : false,
    	shadow : false,
        shadowOffset : 0,
        closeAction: 'hide',
        cls: 'window-notifymsg-alert',
//		style: {
//			borderStyle: 'none',
//			background: 'url(images/framework/popmsg.png) no-repeat 0 0',
//			backgroundSize: 'cover'
//		},
		bodyStyle: {
			background: 'transparent',
			borderStyle: 'none'
		},
		height : 200,
		width : 400,
		layout : 'fit',
		listeners: {
			afterrender: function(thizz, e, eOpts) {
				thizz.el.on('blur', function() {
				});
				
				thizz.el.on('focus', function() {
				});
			}
		},
//		renderTo : Ext.getBody(),
		_lastTime: '',
		items : [{
			xtype : 'grid',
			border : false,
			style: {
				background: 'transparent'
			},
			bodyStyle: {
				background: 'transparent',
				border: 'none'
			},
			margin: '10 10 20 10',
			columns : {
				items: [
				        {dataIndex : 'id', hidden : true},
						{text : '信息提示', dataIndex : 'userName'},
						{text : '时间', dataIndex : 'lastLoginTime', width : 140},
//						{text : '类型', dataIndex : 'forestryTypeName', width : 70, hidden: true},
//						{text : '来源', dataIndex : 'forestryTypeName', width : 70, renderer : this.srcRenderer, hidden: true},
						{text : '状态', dataIndex : 'role', width : 100, renderer : this.stateRenderer},
						{dataIndex: 'role', flex: 1, width: 60, renderer: this.errorCheckRenderer}
				],
			    defaults: {
			        height: 0
			    }
			},
			store : Ext.create('Ext.data.ArrayStore', {
				fields : [
			 	             'id', 
			 	             'userName', 
			 	             'lastLoginTime', 
//			 	             'msgType', 
//			 	             'forestryTypeName', 
			 	             'role'],
			 	listeners: {
					// 2016.07.05 在column的renderer中已对消息数量进行处理，此处注掉
			 		add: function(store, records, index, eOpts) {
			 			
			 			for (var i = 0; i < records.length; i = i + 1) {
			 				if (records[i].get('role') == '3') {
			 					//Siren.start();
			 					if(flage==true){
			 					if (Ext.getCmp('alarmWindowId').isHidden()) {
			 					//	alert("dsfds");
			 						alertLog(Ext.getCmp('alarmButtonId'), false);
			 					}
			 					flage=false;
			 					}
			 					break;
			 				}
			 			}
			 		}
			 	}
			})
//			store: 'system.SystemMsgNotifyStore'
		}],
		dockedItems: [{
			xtype: 'toolbar',
			dock: 'top',
			style: 'border:none;border-top-left-radius:22px;border-top-right-radius:22px',
			items: [{
				xtype: 'tbspacer',
				width: 20
			}, {
				xtype: 'displayfield',
				value: '告警信息'
			}, '->', {
				text: '静音',
				tooltip: '暂停告警音',
				icon: appBaseUri+'/static/img/nobell.png',
				scope: this,
				handler: function(button) {
					Siren.stop();
				}
			}, {
				xtype: 'tbspacer',
				width: 10
			}, {
				text: '刷新',
				tooltip: '获取告警信息',
				icon: appBaseUri+'/static/img/reload.png',
				scope: this,
				handler:getAlarmNotify
			}, {
				xtype: 'tbspacer',
				width: 20
			}]
		}],
		_popUp: function() {
			var win = this;
			var height = 0;
			if (win.isHidden()) {
				me.alertLog(Ext.getCmp('alarmButtonId'), true);
			}
		},
		_popDown: function() {
			var win = this;
			win.animate({
				duration: 1000,
				dynamic: true,
				listeners: {
					afteranimate: function(anime) {
//		       			var win = this.target.target;
		       			win.hide();
		       		}
				}
			});
		}
    });
	var viewport = Ext.create('Ext.Viewport', {
		layout : 'border',
		xtype: 'appFooter',
		items : [ {
			region : 'north',
			xtype : 'container',
			height : 50,
			id : 'app-header',
			layout : {
				type : 'hbox',
				align : 'middle'
			},
			defaults : {
				xtype : 'component'
			},
			items : [ {
				html : '<img src = "' + appBaseUri + '/static/img/logo.png" width="45" height="45" />',
				width : 55
			}, {
				id : 'app-header-title',
				html : appName,
				width : 250
			}, {
				html : '欢迎您，' + userName,
				style : 'text-align:center;font-size:14px;',
				flex : 1
			}, {
				width : 120,
				xtype : 'button',
				text : '个人中心',
				icon : appBaseUri + '/static/ext/examples/shared/icons/fam/user.gif',
				menu : [ {
					text : '修改密码',
					iconCls : 'icon_key',
					handler : function() {
						globalObject.openWindow('修改密码', 'profile.ChangePassword', 300);
					}
				}, '-', {
					text : '切换主题',
					handler : function() {
						function getQueryParam(name, queryString) {
							var match = RegExp(name + '=([^&]*)').exec(queryString || location.search);
							return match && decodeURIComponent(match[1]);
						}

						function hasOption(opt) {
							var s = window.location.search;
							var re = new RegExp('(?:^|[&?])' + opt + '(?:[=]([^&]*))?(?:$|[&])', 'i');
							var m = re.exec(s);

							return m ? (m[1] === undefined ? true : m[1]) : false;
						}

						var scriptTags = document.getElementsByTagName('script'), defaultTheme = 'neptune', defaultRtl = false, i = scriptTags.length, requires = [ 'Ext.toolbar.Toolbar', 'Ext.form.field.ComboBox', 'Ext.form.FieldContainer', 'Ext.form.field.Radio'

						], defaultQueryString, src, theme, rtl;

						while (i--) {
							src = scriptTags[i].src;
							if (src.indexOf('include-ext.js') !== -1) {
								defaultQueryString = src.split('?')[1];
								if (defaultQueryString) {
									defaultTheme = getQueryParam('theme', defaultQueryString) || defaultTheme;
									defaultRtl = getQueryParam('rtl', defaultQueryString) || defaultRtl;
								}
								break;
							}
						}

						Ext.themeName = theme = getQueryParam('theme') || defaultTheme;

						rtl = getQueryParam('rtl') || defaultRtl;

						if (rtl.toString() === 'true') {
							requires.push('Ext.rtl.*');
							Ext.define('Ext.GlobalRtlComponent', {
								override : 'Ext.AbstractComponent',
								rtl : true
							});
						}

						Ext.require(requires);

						Ext.getBody().addCls(Ext.baseCSSPrefix + 'theme-' + Ext.themeName);

						if (Ext.isIE6 && theme === 'neptune') {
							Ext.Msg.show({
								title : 'Browser Not Supported',
								msg : 'The Neptune theme is not supported in IE6.',
								buttons : Ext.Msg.OK,
								icon : Ext.Msg.WARNING
							});
						}

						if (hasOption('nocss3')) {
							Ext.supports.CSS3BorderRadius = false;
							Ext.getBody().addCls('x-nbr x-nlg');
						}
						function setParam(param) {
							var queryString = Ext.Object.toQueryString(Ext.apply(Ext.Object.fromQueryString(location.search), param));
							location.search = queryString;
						}

						function removeParam(paramName) {
							var params = Ext.Object.fromQueryString(location.search);

							delete params[paramName];

							location.search = Ext.Object.toQueryString(params);
						}

						var toolbar = Ext.widget({
							xtype : 'toolbar',
							border : true,
							rtl : false,
							id : 'options-toolbar',
							floating : true,
							fixed : true,
							preventFocusOnActivate : true,
							draggable : {
								constrain : true
							},
							items : [ {
								xtype : 'combo',
								rtl : false,
								width : 170,
								labelWidth : 45,
								fieldLabel : '主题',
								displayField : 'name',
								valueField : 'value',
								labelStyle : 'cursor:move;',
								margin : '0 5 0 0',
								store : Ext.create('Ext.data.Store', {
									fields : [ 'value', 'name' ],
									data : [ {
										value : 'classic',
										name : 'Classic'
									}, {
										value : 'gray',
										name : 'Gray'
									}, {
										value : 'neptune',
										name : 'Neptune'
									} ]
								}),
								value : theme,
								listeners : {
									select : function(combo) {
										var theme = combo.getValue();
										if (theme !== defaultTheme) {
											setParam({
												theme : theme
											});
										} else {
											removeParam('theme');
										}
									}
								}
							}, {
								xtype : 'button',
								rtl : false,
								hidden : !(Ext.repoDevMode || location.href.indexOf('qa.sencha.com') !== -1),
								enableToggle : true,
								pressed : rtl,
								text : 'RTL',
								margin : '0 5 0 0',
								listeners : {
									toggle : function(btn, pressed) {
										if (pressed) {
											setParam({
												rtl : true
											});
										} else {
											removeParam('rtl');
										}
									}
								}
							}, {
								xtype : 'tool',
								type : 'close',
								rtl : false,
								handler : function() {
									toolbar.destroy();
								}
							} ],

							// Extra constraint margins within default constrain region of parentNode
							constraintInsets : '0 -' + (Ext.getScrollbarSize().width + 4) + ' 0 0'
						});
						toolbar.show();
						toolbar.alignTo(document.body, Ext.optionsToolbarAlign || 'tr-tr', [ (Ext.getScrollbarSize().width + 4) * (Ext.rootHierarchyState.rtl ? 1 : -1), -(document.body.scrollTop || document.documentElement.scrollTop) ]);

						var constrainer = function() {
							toolbar.doConstrain();
						};

						Ext.EventManager.onWindowResize(constrainer);
						toolbar.on('destroy', function() {
							Ext.EventManager.removeResizeListener(constrainer);
						});
					}
				}, '-', {
					text : '安全退出',
					handler : function() {
						top.location.href = appBaseUri + '/sys/sysuser/logout';
					}
				} ]
			} ]
		}, treePanel, mainTab, {
			region : 'south',
			border : false,
			items : [ Ext.create('Ext.ux.StatusBar', {
				border : false,
				height:40,
				text : '',
				style : 'background:#3892D3;',
				defaults : {
					style : 'color:#fff;'
				},
				items : [ '->', 'txk', '-', '©2017', '->', '->',, {
					xtype: 'tbspacer',
					width: 20
				}, {
					text : '监控告警', 
					id : 'alarmButtonId',
					width : 120,
					enableToggle: true,
					_msgNotConfirmed: 0,
					_freshMsg: function() {

						if (this._msgNotConfirmed > 0) {
							this.setText('监控告警<span style="color:red;">(' + this._msgNotConfirmed + ')</span>');
						} else {
							this.setText('监控告警');
						}
					},
					_clearNotConfirmed: function() {
						this._msgNotConfirmed = 0;
						this._freshMsg();
					},
					_increaseNotConfirmed: function() {
						this._msgNotConfirmed += 1;
						this._freshMsg();
					},
					_decreaseNotConfirmed: function() {
						this._msgNotConfirmed -= 1;
						this._freshMsg();
					},
					handler : function() {
						alertLog(this);
					}
				}, {
					xtype: 'tbspacer',
					width: 30
				} ]
			}) ]
		} ]
	});
	  function getAlarmNotify() {
		var me = this;
		Ext.getCmp('alarmButtonId')._clearNotConfirmed();
		//Siren.stop();
		Ext.getCmp('alarmWindowId').down('grid').getStore().removeAll();
		notifystore.removeAll();
		notifystore.load(
				{
//			params : {
////				time : Ext.getCmp('alarmWindowId')._lastTime,
//				time : 0,
//				//alarmType: '41'
//			},
			callback : function(records, operation, success) {
//				Ext.getCmp('alarmWindowId').down('grid').getStore().removeAll();
				if (records.length > 0) {
					//Ext.getCmp('alarmWindowId')._lastTime = records[records.length - 1].get('time');
					
					this.each(function(rec) {
						if (rec.get('role') == '3') {
							Ext.getCmp('alarmButtonId')._increaseNotConfirmed();
						}
						Ext.getCmp('alarmWindowId').down('grid').getStore().insert(0, rec);
					});
					Ext.getCmp('alarmButtonId').setIcon(appBaseUri+'/static/img/2.gif');
				} else {
					Ext.getCmp('alarmButtonId').setIcon('');
					Siren.stop();
				}
			}
		}
				);
	}
	  function alertLog(e, callback) {
//		console.log(e, callback);
		var alarmWindow = Ext.getCmp('alarmWindowId');
	//	var sysRunWindow = Ext.getCmp('sysRunWindowId');
//		var toolbar = Ext.getCmp('quickStartBarId');
		var toolbar = e.up('viewport').down('toolbar');
		var toolbarHeight = toolbar.getHeight();
		
		if (alarmWindow.isHidden()) {
//			if (sysRunWindow.isHidden()) {
//				alarmWindow.setPosition(document.body.clientWidth-408, document.body.clientHeight - 200);
				alarmWindow.setPosition(document.body.clientWidth-420, document.body.clientHeight - toolbarHeight - 230);
				alarmWindow.showAt(document.body.clientWidth-420, document.body.clientHeight-toolbarHeight-230, {
					from: {
						opacity : 0.1
					},
					to: {
						opacity : 1
					},
					duration: 2000,
					listeners: {
						afteranimate: function() {
							if (callback) {
								setTimeout(function() {
									e.up('viewport').alertLog(e);
								}, 5000);
							}
						}
					}
//					to : {
//						opacity : 0.1
//					}
//					easing : 'easeNone'
				});
//			}
//			else {
//				sysRunWindow.el.addCls('window-notifymsg-overlap');
//				sysRunWindow.showAt(document.body.clientWidth-408,document.body.clientHeight-toolbarHeight-400, {
//					duration: 500
//				});
////				alarmWindow.setPosition(document.body.clientWidth-408, document.body.clientHeight - 200);
//				alarmWindow.setPosition(document.body.clientWidth-408, document.body.clientHeight - toolbarHeight - 200);
//				alarmWindow.showAt(document.body.clientWidth-408, document.body.clientHeight-toolbarHeight-200, {
//					from: {
//						opacity : 0.1
//					},
//					to: {
//						opacity : 1
//					},
//					duration: 500,
//					listeners: {
//						afteranimate: function() {
//							if (callback) {
//								setTimeout(function() {
//									e.up('appFooter').alertLog(e);
//								}, 5000);
//							}
//						}
//					}
//				});
//			}
		} else {
			alarmWindow.hide();
			alarmWindow.el.removeCls('window-notifymsg-overlap');
//			if (!sysRunWindow.isHidden()) {
//				sysRunWindow.el.removeCls('window-notifymsg-overlap');
//				sysRunWindow.showAt(document.body.clientWidth-408,document.body.clientHeight-toolbarHeight-200, {
//					duration: 500
//				});
//			}
		}
	};
	
	function onTabChange(tabPanel, tab) {
		var tabs = [], ownerCt = tabPanel.ownerCt, oldToken, newToken;

		tabs.push(tab.id);
		tabs.push(tabPanel.id);

		while (ownerCt && ownerCt.is('tabpanel')) {
			tabs.push(ownerCt.id);
			ownerCt = ownerCt.ownerCt;
		}

		newToken = tabs.reverse().join(tokenDelimiter);

		oldToken = Ext.History.getToken();

		if (oldToken === null || oldToken.search(newToken) === -1) {
			Ext.History.add(newToken);
		}
	}

	function onAfterRender() {
		Ext.History.on('change', function(token) {
			var parts, tabPanel, length, i;

			if (token) {
				parts = token.split(tokenDelimiter);
				length = parts.length;

				for (i = 0; i < length - 1; i++) {
					Ext.getCmp(parts[i]).setActiveTab(Ext.getCmp(parts[i + 1]));
				}
			}
		});

		var activeTab1 = mainTab.getActiveTab(), activeTab2 = activeTab1;
		//getAlarmNotify();
		onTabChange(activeTab1, activeTab2);
		//alertLog(Ext.getCmp('alarmButtonId'), true);
	}
});

var globalObject = new Object();

// 打开tab
globalObject.openTab = function(tabId, tabTitle, tab, config) {
	// console.log(config);
	var _tab = mainTab.getComponent('tab' + tabId);
	if (!_tab) {
		mainTab.setLoading('Loading...');
		_tab = Ext.create('Ext.panel.Panel', {
			closable : true,
			id : 'tab' + tabId,
			title : tabTitle,
			layout : 'fit',
			autoScroll : true,
			border : false,
			items : typeof (tab) == 'string' ? Ext.create('Forestry.app.' + tab, config) : tab
		});
		mainTab.add(_tab);
		mainTab.setLoading(false);
	}
	mainTab.setActiveTab(_tab);
}

 function stateRenderer(val,rec,meta) {
	// console.log(meta);
	if(val == '3') {
	//	alert(meta.get('id'));
		return '<span style="color:red;">' + '普通' +meta.get('userName')+'</span>';
	} else if(val == '1') {
		return '<span style="color:blue;">' + '超管' + '</span>';
	}
}

 function  errorCheckRenderer(val, meta, rec) {
//	 console.log(rec);
	   if(val == '3') {
//		   Siren.start();
//		   Ext.getCmp('alarmButtonId')._increaseNotConfirmed();
		   return '<button msgId="' + rec.getId() + '" msgType="' + rec.get('msgType') + '" onclick="confirmNotifyMsg(event)" style="align:center;">确认</button>';
	   }
 }
// 打开window
globalObject.openWindow = function(winTitle, win, winWidth, config) {
	Ext.create('Ext.window.Window', {
		autoShow : true,
		modal : true,
		title : winTitle,
		id : win,
		resizable : false,
		width : winWidth || 300,
		items : typeof (win) == 'string' ? Ext.create('Forestry.app.' + win, config) : win
	});
}

// 关闭tab
globalObject.closeTab = function(tabId) {
	var tab = mainTab.getActiveTab();
	tab.close();
	if (tabId != undefined) {
		mainTab.setActiveTab(tabId);
	}
};

// 刷新ActiveTab下的gridpanel
globalObject.listReload = function() {
	if (mainTab.getActiveTab().down('gridpanel'))
		mainTab.getActiveTab().down('gridpanel').getStore().reload();
}

// 成功提示
globalObject.msgTip = function(msg) {
	function createBox(t, s) {
		return '<div class="msg"><h3>' + t + '</h3><p>' + s + '</p></div>';
	}

	var msgCt;
	if (!msgCt) {
		msgCt = Ext.DomHelper.insertFirst(document.body, {
			id : 'msg-div'
		}, true);
	}
	var m = Ext.DomHelper.append(msgCt, createBox('系统信息', msg), true);
	m.hide();
	m.slideIn('t').ghost("t", {
		delay : 2000,
		remove : true
	});
};

// 错误提示
globalObject.errTip = function(msg, e) {
	Ext.MessageBox.show({
		title : '出错信息',
		msg : msg,
		buttons : Ext.MessageBox.OK,
		animateTarget : e,
		icon : Ext.MessageBox.ERROR
	});
};

// 一般提示
globalObject.infoTip = function(msg, e) {
	Ext.MessageBox.show({
		title : '系统信息',
		msg : msg,
		buttons : Ext.MessageBox.OK,
		animateTarget : e,
		icon : Ext.MessageBox.INFO
	});
};

// 选择性提示
globalObject.confirmTip = function(msg, fn, buttons, e) {
	Ext.MessageBox.show({
		title : '系统信息',
		msg : msg,
		buttons : buttons || Ext.MessageBox.YESNO,
		animateTarget : e,
		fn : fn
	});
};

// 控制台日志
globalObject.log = function(obj) {
	if (window.console) {
		console.log(obj);
	}
}

// 拥有指定权限
globalObject.haveAction = function(name) {
	return Ext.Array.contains(idata.myInfo.actions, name);
}

// 拥有指定按钮
globalObject.haveActionMenu = function(items, name) {
	if (items && items.length > 0)
		return Ext.Array.contains(items, name)
	return false;
}

// 拥有指定角色
globalObject.haveRole = function(name) {
	return Ext.Array.contains(idata.myInfo.roles, name);
}

// 执行指定Action
globalObject.run = function(url, params, itemStore) {
	Ext.Ajax.request({
		url : url,
		params : params,
		success : function(response) {
			if (response.responseText != '') {
				var res = Ext.JSON.decode(response.responseText);
				if (res.success) {
					globalObject.msgTip('操作成功！');
					if (itemStore)
						itemStore.reload();
				} else
					globalObject.errTip(res.msg);
			}
		}
	});
}

// 拥有指定列
globalObject.haveColumn = function(cName) {
	var columns = idata.myInfo.roleColumns[cName];
	this.have = function(columnName) {
		if (columns == undefined)
			return -2;
		return Ext.Array.contains(columns, columnName);
	}
}

function StringBuffer() {
	this._strings_ = new Array();
}

StringBuffer.prototype.append = function(str) {
	this._strings_.push(str);
};

StringBuffer.prototype.toString = function() {
	return this._strings_.join("");
};
