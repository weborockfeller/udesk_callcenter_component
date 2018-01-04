import images from './images';
import CallInfo from '../CallInfo';
import utils from '../Tools';
import ButtonWithImage from './ButtonWithImage';
import AgentSelect from './AgentSelect';
import Alert from './Alert';
import CustomerInfo from './CustomerInfo';
import React from 'react';
import HangupButton from './HangupButton';
import IvrNodeSelect from './IvrNodeSelect';
import { stopConsult, startConsult, startThreeWayCalling, transfer,holdCallSelect,recoveryCallSelect } from '../CallUtil';

export default class TalkingPanelComponent extends React.Component {
    constructor() {
        super();
        this.state = {
            talkingTime: 0,
            agentSelectType: null,
            queue_desc: CallInfo.queue_desc,
            can_end_consult: false

        };
        let self = this;
        CallInfo.on('change', this.onCallInfoChange = function(k, v) {
            let obj = {};
            obj[k] = v;
            console.log(obj)
            self.setState(obj);
        });
    }

    render() {
        let agentSelectWrapperClass = 'agent-select-wrapper';
        let descInfoContent = '';
        if (this.state.queue_desc) {
            descInfoContent = '来源:' + this.state.queue_desc;
        }
        if (!this.state.showAgentSelect || this.state.direction === 'out' || this.state.can_end_consult ||
            (!this.state.can_consult && !this.state.can_transfer && !this.state.can_three_party && !this.state.can_transfer_ivr)) {
            agentSelectWrapperClass += ' hide';
        }

        return <div className="text-center talking-panel">
            <img src={images.customer_head}/>
            <CustomerInfo/>
            <hr/>
            <div className="desc-info">{descInfoContent}</div>
            <div className="time-info">{utils.humanizeTime(this.state.talkingTime)}</div>
            <div className={agentSelectWrapperClass}>
                {(() => {
                    if (this.state.agentSelectType === 'ivr_node') {
                        return <IvrNodeSelect onChange={this.selectAgent.bind(this)}/>
                    }else {
                        return <AgentSelect onChange={this.selectAgent.bind(this)}/>
                    }
                })()}
            </div>
            <div className='bottom-btns'>
                <div className="btn-group">
                    <ButtonWithImage image={images.ivrIcon} normalHandler={this.showIvrSelect.bind(this)}
                                     content="IVR"
                                     className={this.state.can_transfer_ivr ? '' : 'hide'}
                                     state={this.state.agentSelectType !== 'ivr_node' ? 'normal' : 'cancel'}
                                     cancelHandler={this.hideAgentSelect.bind(this)}/>
                    <ButtonWithImage image={images.call_retain} normalHandler={this.holdCallSelect.bind(this)}
                                     content="保持"
                                     className={this.state.can_hold ? '' : 'hide'}
                                     state= 'normal'
                                     cancelHandler={this.hideAgentSelect.bind(this)}/>
                    <ButtonWithImage image={images.call_recovery} normalHandler={this.recoveryCallSelect.bind(this)}
                                     content="取回"
                                     className={this.state.can_retrieval ? '' : 'hide'}
                                     state='normal'/>
                    <ButtonWithImage image={images.transfer} normalHandler={this.showTransferAgentSelect.bind(this)}
                                     content="转移"
                                     className={this.state.can_transfer ? '' : 'hide'}
                                     state={this.state.agentSelectType !== 'transfer' ? 'normal' : 'cancel'}
                                     cancelHandler={this.hideAgentSelect.bind(this)}/>
                    <ButtonWithImage image={images.consult} normalHandler={this.showConsultAgentSelect.bind(this)}
                                     content="咨询"
                                     className={this.state.can_consult ? '' : 'hide'}
                                     state={this.state.agentSelectType !== 'consult' ? 'normal' : 'cancel'}
                                     cancelHandler={this.hideAgentSelect.bind(this)}/>
                    <ButtonWithImage image={images.threeWayCalling}
                                     normalHandler={this.showThreeWayAgentSelect.bind(this)}
                                     content="三方"
                                     className={this.state.can_three_party ? '' : 'hide'}
                                     state={this.state.agentSelectType !== 'threeWay' ? 'normal' : 'cancel'}
                                     cancelHandler={this.hideAgentSelect.bind(this)}/>
                    <ButtonWithImage image={images.consult} normalHandler={this.stopConsult.bind(this)}
                                     className={this.state.can_end_consult ? '' : 'hide'}
                                     state='normal' content="恢复"
                    />
                </div>
            </div>
            {(() => {
                if (CallInfo.can_hangup) {
                    return <div><HangupButton/></div>;
                }
            })()}
        </div>;
    }

    selectAgent(agent) {
        let self = this;
        if (this.state.agentSelectType === 'transfer') {
            transfer(agent.id, function() {
                Alert.success('转移的请求已经发送！');
            }, function(res) {
                Alert.error(res.message || '转移失败！');
            });
        } else if (this.state.agentSelectType === 'consult') {
            startConsult(agent.id, function(res) {
                Alert.success('咨询的请求已经发送！');
            }, function(res) {
                Alert.error(res.message || '咨询失败');
            });
        } else if (this.state.agentSelectType === 'threeWay') {
            startThreeWayCalling(agent.id, function() {
                Alert.success('三方的请求已经发送！');
            }, function(res) {
                Alert.error(res.message || '三方失败！');
            });
        } else if(this.state.agentSelectType === 'ivr_node'){
            startIvrCalling(agent, function() {
                self.hideAgentSelect();
                Alert.success('ivr的请求已经发送！');
            }, function(res) {
                Alert.error(res.message || '转接ivr失败！');
            });
        }
    }

    stopConsult() {
        stopConsult(function() {
            Alert.success('正在取消咨询');
        }, function(res) {
            Alert.error(res.message || '取消咨询失败');
        });
    }
    holdCallSelect() {
        holdCallSelect(function(){
            Alert.success('正在保持通话');
        },function(res){
            Alert.error(res.message || '保持通话失败');
        })
    }
    recoveryCallSelect() {
        recoveryCallSelect(()=>{
            Alert.success('正在取回通话');
        },function(res){
            Alert.error(res.message || '取回通话失败');
        })
    }

    showTransferAgentSelect() {
        this.setState({agentSelectType: 'transfer', showAgentSelect: true});
    }

    showConsultAgentSelect() {
        this.setState({agentSelectType: 'consult', showAgentSelect: true});
    }

    showThreeWayAgentSelect() {
        this.setState({agentSelectType: 'threeWay', showAgentSelect: true});
    }

    showIvrSelect() {
        this.setState({agentSelectType: 'ivr_node', showAgentSelect: true});
    }
    hideAgentSelect() {
        this.setState({agentSelectType: null, showAgentSelect: false});
    }

    componentWillUnmount() {
        CallInfo.off('change', this.onCallInfoChange);
    }
}
