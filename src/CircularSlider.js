import React, { PureComponent } from 'react'
import { PanResponder, View } from 'react-native'
import Svg, { Circle, G, Path } from 'react-native-svg'

export default class CircularSlider extends PureComponent {
  constructor () {
    super()
    this.state = {
      circleCenterX: false,
      circleCenterY: false,
      prevStartAngle: null,
      angleTouchStart: null
    }

    /**
     * Handles touch events on start handle
     */
    this._startPanResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderMove: (evt, { moveX, moveY }) => {
        const { circleCenterX, circleCenterY } = this.state
        const { angleLength, startAngle, onUpdate } = this.props

        const currentAngleStop = (startAngle + angleLength) % (2 * Math.PI)
        let newAngle = Math.atan2(moveY - circleCenterY, moveX - circleCenterX) + Math.PI / 2

        if (newAngle < 0) {
          newAngle += 2 * Math.PI
        }

        let newAngleLength = currentAngleStop - newAngle

        if (newAngleLength < 0) {
          newAngleLength += 2 * Math.PI
        }
        onUpdate({ startAngle: newAngle, angleLength: newAngleLength % (2 * Math.PI) })
      }
    })

    /**
     * Handles touch events on slider element, effecting
     * position of both start and end handler
     */
    this._sliderPanResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,

      // On interaction start
      onPanResponderGrant: (evt, gestureState) => this.onSliderPanStart(evt, gestureState),
      onPanResponderMove: (evt, { moveX, moveY }) => {
        const {
          circleCenterX,
          circleCenterY,
          prevStartAngle,
          angleTouchStart
        } = this.state

        const { angleLength, onUpdate } = this.props

        let newAngle = Math.atan2(moveY - circleCenterY, moveX - circleCenterX) + Math.PI / 2

        const diff = newAngle - angleTouchStart
        let next = prevStartAngle + diff
        const fullCircle = Math.PI * 12 / 6

        if (next < 0) {
          next += 2 * Math.PI
        }

        // Next value should never be more than one full circle
        if (fullCircle < next) {
          next = next % fullCircle
        }

        onUpdate({ startAngle: next, angleLength })
      }
    })

    /**
    * Handles touch events on start handle
    */
    this._endPanResponder = PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponderCapture: (evt, gestureState) => true,
      onPanResponderMove: (evt, { moveX, moveY }) => {
        const { circleCenterX, circleCenterY } = this.state
        const { startAngle, onUpdate } = this.props

        let newAngle = Math.atan2(moveY - circleCenterY, moveX - circleCenterX) + Math.PI / 2
        let newAngleLength = (newAngle - startAngle) % (2 * Math.PI)

        if (newAngleLength < 0) {
          newAngleLength += 2 * Math.PI
        }

        onUpdate({ startAngle, angleLength: newAngleLength })
      }
    })
  }

  /**
   * Called when user starts interacting with slider
   */
  onSliderPanStart (evt, { moveX, moveY }) {
    const { circleCenterX, circleCenterY } = this.state
    let newAngle = Math.atan2(moveY - circleCenterY, moveX - circleCenterX) + Math.PI / 2

    if (newAngle < 0) {
      newAngle += 2 * Math.PI
    }

    this.setState({
      prevStartAngle: this.props.startAngle, /* Previous angle, before user interaction */
      angleTouchStart: newAngle /* Initial angle (on press in) */
    })
  }

  componentDidMount () {
    this.setCircleCenter()
  }

  setCircleCenter = () => {
    this._circle.measure((x, y, w, h, px, py) => {
      const halfOfContainer = this.getContainerWidth() / 2

      this.setState({
        circleCenterX: px + halfOfContainer,
        circleCenterY: py + halfOfContainer
      })
    })
  }

  getContainerWidth () {
    const { strokeWidth, radius } = this.props
    return strokeWidth + radius * 2 + 2
  }

  /**
   * Calculates the length of the active slider
   */
  calculateArcCircle (index0, segments, radius, startAngle0 = 0, angleLength0 = 2 * Math.PI) {
    // Add 0.0001 to the possible angle so when start = stop angle, whole circle is drawn
    const startAngle = startAngle0 % (2 * Math.PI)
    const angleLength = angleLength0 % (2 * Math.PI)
    const index = index0 + 1
    const fromAngle = angleLength / segments * (index - 1) + startAngle
    const toAngle = angleLength / segments * index + startAngle
    const fromX = radius * Math.sin(fromAngle)
    const fromY = -radius * Math.cos(fromAngle)
    const realToX = radius * Math.sin(toAngle)
    const realToY = -radius * Math.cos(toAngle)

    // add 0.005 to start drawing a little bit earlier so segments stick together
    const toX = radius * Math.sin(toAngle + 0.005)
    const toY = -radius * Math.cos(toAngle + 0.005)

    return {
      fromX,
      fromY,
      toX,
      toY,
      realToX,
      realToY
    }
  }

  render () {
    const {
      startAngle,
      angleLength,
      strokeWidth,
      radius,
      backgroundFillColor,
      fillColor,
      startIcon,
      stopIcon
    } = this.props

    /*
     * 1. Number of segments to divide the slider in,
     * used to imitate canonical gradients by using multiple linear gradients
     * across the slider. Since this slider does not use gradients,
     * 2 (and an array of length of two values) equals filling the slider completely.
     */
    const segments = 2 /* 1. */
    const range = [0, 1] /* 1. */

    const containerWidth = this.getContainerWidth()
    const start = this.calculateArcCircle(0, segments, radius, startAngle, angleLength)
    const stop = this.calculateArcCircle(segments - 1, segments, radius, startAngle, angleLength)

    return (
      <View
        style={{ width: containerWidth, height: containerWidth }}
        onLayout={() => this.setCircleCenter()}>
        <Svg
          viewBox={`-20 -20 ${containerWidth + 40} ${containerWidth + 40}`}
          width='100%'
          height='100%'
          preserveAspectRatio='xMidYMid slice'
          ref={circle => { this._circle = circle }}
        >

          {/* Circle */ }
          <G transform={`translate(${strokeWidth / 2 + radius + 1}, ${strokeWidth / 2 + radius + 1})`}>
            <Circle
              r={radius}
              strokeWidth={strokeWidth}
              fill='transparent'
              stroke={backgroundFillColor}
            />
            {
              range.map(i => {
                const {
                  fromX,
                  fromY,
                  toX,
                  toY
                } = this.calculateArcCircle(i, segments, radius, startAngle, angleLength)
                const d = `M ${fromX.toFixed(2)} ${fromY.toFixed(2)} A ${radius} ${radius} 0 0 1 ${toX.toFixed(2)} ${toY.toFixed(2)}`

                return (
                  <Path
                    {...this._sliderPanResponder.panHandlers}
                    d={d}
                    key={i}
                    strokeWidth={strokeWidth}
                    stroke={fillColor}
                    fill='transparent'
                    onPressIn={() => this.setState({ startAngle: startAngle - Math.PI / 2, angleLength: angleLength + Math.PI / 2 })}
                  />
                )
              })
            }

            {/* Icon at the end of slider */}
            <G transform={`translate(${stop.toX}, ${stop.toY})`}
              onPressIn={() => this.setState({ angleLength: angleLength + Math.PI / 2 })}
              {...this._endPanResponder.panHandlers} >
              { stopIcon }
            </G>

            {/* Icon at the start of slider */}
            <G transform={`translate(${start.fromX}, ${start.fromY})`}
              onPressIn={() => this.setState({ startAngle: startAngle - Math.PI / 2, angleLength: angleLength + Math.PI / 2 })}
              {...this._startPanResponder.panHandlers} >
              { startIcon }
            </G>

          </G>
        </Svg>
      </View>
    )
  }
}
