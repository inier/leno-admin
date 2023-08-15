import { Badge, Popover, Tabs } from 'antd'
import { useState } from 'react'
import { NotificationOutlined } from '@ant-design/icons'
import classes from './index.module.scss'
import useStore from '@/store'
import { observer } from 'mobx-react-lite'
import { toJS } from 'mobx'

const NoticeCom = () => {
  const [show, setShow] = useState(false)
  const [open, setOpen] = useState(false)
  const {
    useSocketStore: { notices },
  } = useStore()

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
  }

  const onChange = (key: string) => {
    console.log(key)
  }

  const noticeDiv = (
    <div className={classes['notice-div']}>
      <Tabs
        defaultActiveKey="1"
        onChange={onChange}
        items={[
          {
            label: `通知`,
            key: '1',
            children: (
              <>
                {toJS(notices).map((item) => {
                  if (item.noticeType === '1') {
                    return (
                      <div key={item.noticeId}>
                        <h4>{item.noticeTitle}</h4>
                        <div
                          className={classes['notice-content']}
                          dangerouslySetInnerHTML={{ __html: item.noticeContent as string }}
                        />
                      </div>
                    )
                  }
                })}
              </>
            ),
          },
          {
            label: `公告`,
            key: '2',
            children: (
              <>
                {toJS(notices).map((item) => {
                  if (item.noticeType === '2') {
                    return (
                      <div key={item.noticeId}>
                        <h4>{item.noticeTitle}</h4>
                        <div
                          className={classes['notice-content']}
                          dangerouslySetInnerHTML={{ __html: item.noticeContent as string }}
                        />
                      </div>
                    )
                  }
                })}
              </>
            ),
          },
        ]}
      />
    </div>
  )

  return (
    <Popover content={noticeDiv} trigger="click" open={open} onOpenChange={handleOpenChange}>
      <Badge dot={show}>
        <NotificationOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Popover>
  )
}

export default observer(NoticeCom)
