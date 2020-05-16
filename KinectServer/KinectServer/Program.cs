using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Windows;
using Microsoft.Kinect;
using Fleck;

namespace KinectServer
{
    enum InteractionMode
	{
	    JOINT_ANGLES, CLOSING_HANDS
	}

    class Program
    {
        static KinectSensor sensor;
        static Skeleton skeleton;
        static List<IWebSocketConnection> sockets;
        static bool initialized = false;
        static Skeleton[] allSkeletons = new Skeleton[skeletonCount];
        static bool closing = false;

        // constants
        const int RESX = 1024;
        const int RESY = 768;
        const int skeletonCount = 6;
        const int BLUE = 0;
        const int GREEN = 1;
        const int RED = 2;
        const int WHITE = 255;
        const int BLACK = 0;
        const int GRAY = 110;
        const float MaxDepthDistance = 4095; // max value returned
        const float MinDepthDistance = 850; // min value returned
        const float MaxDepthDistanceOffset = MaxDepthDistance - MinDepthDistance;

        const InteractionMode interactionMode = InteractionMode.CLOSING_HANDS;
        const int bufferSize = 10;
        static int[] bufferLeftHand = new int[bufferSize];
        static int[] bufferRightHand = new int[bufferSize];
        const int numberToTestBuffer = 7;

        // calibration constants
        const int handDepthLimitFront = 70;
        const int handDepthLimitBack = 30;
        const int fingertipLimit = 0;
        const int pointsInterval = 6; // 8
        const float limitAngleToBeFingertip = 50; // 50


        static void Main(string[] args)
        {
            InitilizeKinect();
            InitializeSockets();
        }

        private static void InitializeSockets()
        {
            sockets = new List<IWebSocketConnection>();

            var server = new WebSocketServer("ws://localhost:8181");

            server.Start(socket =>
            {
                socket.OnOpen = () =>
                {
                    Console.WriteLine("Connected to " + socket.ConnectionInfo.ClientIpAddress);
                    sockets.Add(socket);
                };
                socket.OnClose = () =>
                {
                    Console.WriteLine("Disconnected from " + socket.ConnectionInfo.ClientIpAddress);
                    sockets.Remove(socket);
                };
                socket.OnMessage = message =>
                {
                    //Console.WriteLine(message);
                };
            });

            initialized = true;

            Console.ReadLine();
        }

        private static void InitilizeKinect()
        {
            if (KinectSensor.KinectSensors.Count > 0)
            {
                sensor = KinectSensor.KinectSensors[0];
                sensor.DepthStream.Enable(DepthImageFormat.Resolution320x240Fps30);
                sensor.ColorStream.Enable(ColorImageFormat.RgbResolution640x480Fps30);
                sensor.SkeletonStream.Enable();
                sensor.AllFramesReady += new EventHandler<AllFramesReadyEventArgs>(kinect_AllFramesReady);
                sensor.Start();
            }
        }

        private static void kinect_AllFramesReady(object sender, AllFramesReadyEventArgs e)
        {
            string json = "{}";
            skeleton = null;

            using (SkeletonFrame skeletonFrame = e.OpenSkeletonFrame())
            {
                if (skeletonFrame != null)
                {
                    skeletonFrame.CopySkeletonDataTo(allSkeletons);

                    GetClosestSkeleton();
                    //get the first tracked skeleton
                    //skeleton =
                    //    (from s in allSkeletons
                    //     where s.TrackingState == SkeletonTrackingState.Tracked
                    //     select s).FirstOrDefault();
                }
            }

            if (skeleton != null)
            {
                int leftHand, rightHand;
                double leftHandZ = skeleton.Joints[JointType.HipCenter].Position.Z - skeleton.Joints[JointType.HandLeft].Position.Z;
                double rightHandZ = skeleton.Joints[JointType.HipCenter].Position.Z - skeleton.Joints[JointType.HandRight].Position.Z;

                if (interactionMode == InteractionMode.CLOSING_HANDS)
                {
                    using (DepthImageFrame depthFrame = e.OpenDepthImageFrame())
                    {
                        if (depthFrame == null)
                        {
                            leftHand = rightHand = 0;
                        }
                        else
                        {
                            // left hand
                            DepthImagePoint leftDepthPointCenter =
                                depthFrame.MapFromSkeletonPoint(skeleton.Joints[JointType.HandLeft].Position);
                            DepthImagePoint leftDepthPointWrist =
                                depthFrame.MapFromSkeletonPoint(skeleton.Joints[JointType.WristLeft].Position);
                            //right hand
                            DepthImagePoint rightDepthPointCenter =
                                depthFrame.MapFromSkeletonPoint(skeleton.Joints[JointType.HandRight].Position);
                            DepthImagePoint rightDepthPointWrist =
                                depthFrame.MapFromSkeletonPoint(skeleton.Joints[JointType.WristRight].Position);

                            // get raw depth data
                            short[] rawDepthData = new short[depthFrame.PixelDataLength];
                            depthFrame.CopyPixelDataTo(rawDepthData);

                            leftHand = isHandClosed(rawDepthData, depthFrame.Width, depthFrame.Height, leftDepthPointCenter, leftDepthPointWrist) && (leftHandZ > 0.2) ? 1 : 0;
                            rightHand = isHandClosed(rawDepthData, depthFrame.Width, depthFrame.Height, rightDepthPointCenter, rightDepthPointWrist) && (rightHandZ > 0.2   ) ? 1 : 0;
                        }
                    }
                }
                else
                {
                    double angleLeftHand = getAngleBetweenPoints(skeleton.Joints[JointType.HandLeft].Position, skeleton.Joints[JointType.ElbowLeft].Position, skeleton.Joints[JointType.ShoulderLeft].Position);
                    double angleLeftElbow = getAngleBetweenPoints(skeleton.Joints[JointType.ElbowLeft].Position, skeleton.Joints[JointType.ShoulderLeft].Position, skeleton.Joints[JointType.HipLeft].Position);
                    leftHand = (((angleLeftHand > 110.0) && (angleLeftElbow > 90.0)) || (leftHandZ > 0.5)) ? 1 : 0;

                    double angleRightHand = getAngleBetweenPoints(skeleton.Joints[JointType.HandRight].Position, skeleton.Joints[JointType.ElbowRight].Position, skeleton.Joints[JointType.ShoulderRight].Position);
                    double angleRightElbow = getAngleBetweenPoints(skeleton.Joints[JointType.ElbowRight].Position, skeleton.Joints[JointType.ShoulderRight].Position, skeleton.Joints[JointType.HipRight].Position);
                    rightHand = (((angleRightHand > 110.0) && (angleRightElbow > 90.0)) || (rightHandZ > 0.5)) ? 1 : 0;
                }

                bufferLeftHand = refreshBuffer(bufferLeftHand, leftHand);
                bufferRightHand = refreshBuffer(bufferRightHand, rightHand);
                leftHand = testBuffer(bufferLeftHand);
                rightHand = testBuffer(bufferRightHand);

                json =
                    "{"+
                    "  'leftHand': {'x': " + BalanceXAxis(skeleton.Joints[JointType.HandLeft].ScaleTo(RESX, RESY).Position.X).ToString().Replace(",", ".") +
                                ", 'y': " + BalanceYAxis(skeleton.Joints[JointType.HandLeft].ScaleTo(RESX, RESY).Position.Y).ToString().Replace(",", ".") +
                                ", 'z':" + leftHandZ.ToString().Replace(",", ".") +
                                "}, 'leftClick': " + leftHand.ToString() +
                    ", 'rightHand': {'x': " + BalanceXAxis(skeleton.Joints[JointType.HandRight].ScaleTo(RESX, RESY).Position.X).ToString().Replace(",", ".") +
                                ", 'y': " + BalanceYAxis(skeleton.Joints[JointType.HandRight].ScaleTo(RESX, RESY).Position.Y).ToString().Replace(",", ".") +
                                ", 'z':" + rightHandZ.ToString().Replace(",", ".") +
                                "}, 'rightClick': " + rightHand.ToString() +
                    ", 'head': {'x': " + skeleton.Joints[JointType.Head].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.Head].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    ", 'leftShoulder': {'x': " + skeleton.Joints[JointType.ShoulderLeft].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.ShoulderLeft].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    ", 'rightShoulder': {'x': " + skeleton.Joints[JointType.ShoulderRight].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.ShoulderRight].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    ", 'leftElbow': {'x': " + skeleton.Joints[JointType.ElbowLeft].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.ElbowLeft].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    ", 'rightElbow': {'x': " + skeleton.Joints[JointType.ElbowRight].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.ElbowRight].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    ", 'leftHip': {'x': " + skeleton.Joints[JointType.HipLeft].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.HipLeft].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    ", 'rightHip': {'x': " + skeleton.Joints[JointType.HipRight].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.HipRight].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    ", 'leftAnkle': {'x': " + skeleton.Joints[JointType.AnkleLeft].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.AnkleLeft].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    ", 'rightAnkle': {'x': " + skeleton.Joints[JointType.AnkleRight].ScaleTo(RESX, RESY).Position.X.ToString().Replace(",", ".") +
                                ", 'y': " + skeleton.Joints[JointType.AnkleRight].ScaleTo(RESX, RESY).Position.Y.ToString().Replace(",", ".") +
                                "} " +
                    "}";
            }

            foreach (var socket in sockets)
            {
                socket.Send(json);
            }

        }

        private static void GetClosestSkeleton()
        {
            if (allSkeletons != null)
            {
                foreach (Skeleton s in allSkeletons)
                {
                    if (s.TrackingState == SkeletonTrackingState.Tracked)
                    {
                        if ((skeleton == null) || (skeleton.Position.Z > s.Position.Z))
                        {
                            skeleton = s;
                        }
                    }
                }
            }
        }

        private static int[] refreshBuffer(int[] buffer, int newValue)
        {
            for (int i = 0; i < buffer.Length - 1; i++)
                buffer[i] = buffer[i + 1];
            buffer[buffer.Length - 1] = newValue;
            return buffer;
        }

        private static int testBuffer(int[] buffer)
        {
            int count = 0; // buffer.Sum();
            for (int i = 0; i < buffer.Length; i++)
                count += buffer[i];
            return (count >= numberToTestBuffer ? 1 : 0);
        }

        private static bool isHandClosed(short[] rawDepthData, int frameWidth, int frameHeight, DepthImagePoint handCenterPoint, DepthImagePoint handWristPoint)
        {
            int squareHalfSize = getDistance(handCenterPoint, handWristPoint) * 3;
            int squareSize = squareHalfSize * 2;
            // create an image
            byte[] pixels = new byte[squareSize * squareSize];
            List<Point> contourPoints = new List<Point>();
            List<int> insidePoints = new List<int>();
            int startingPoint = -1;

            if (handCenterPoint.X < 0 || handCenterPoint.X >= frameWidth || handCenterPoint.Y < 0 || handCenterPoint.Y >= frameHeight)
                return false;

            int centerDistance = rawDepthData[handCenterPoint.Y * frameWidth + handCenterPoint.X] >> DepthImageFrame.PlayerIndexBitmaskWidth;
            byte intensity;

            // the square is centered on the center of the hand
            // the upper left corner is a point like (center-size, center-size)
            // the lower rigt corner is a point like (center+size, center+size)
            for (int i = handCenterPoint.Y - squareHalfSize, colorIndex = 0; i < handCenterPoint.Y + squareHalfSize; i++)
            {
                if (i < 0 || i >= frameHeight)
                    continue;

                for (int j = handCenterPoint.X - squareHalfSize; (j < handCenterPoint.X + squareHalfSize) && (colorIndex < pixels.Length); j++, colorIndex++)
                {
                    if (j < 0 || j >= frameWidth)
                        continue;

                    int distance = rawDepthData[i * frameWidth + j] >> DepthImageFrame.PlayerIndexBitmaskWidth;
                    // test if minDistance < distanceDifference < maxDistance
                    if (((distance - centerDistance) < -handDepthLimitFront) // front of the hand
                        || ((distance - centerDistance) > handDepthLimitBack)) // back of the hand
                        intensity = BLACK;
                    else
                        intensity = GRAY;
                    pixels[colorIndex] = intensity;
                }
            }

            // extract contour points of the hand with a 3x3 mask
            for (int i = 1; i < squareSize - 1; i++)
            {
                for (int j = 1; j < squareSize - 1; j++)
                {
                    if (pixels[i * squareSize + j] == BLACK)
                        continue;
                    if (
                           (pixels[(i - 1) * squareSize + j - 1] == GRAY)
                        && (pixels[(i - 1) * squareSize + j] == GRAY)
                        && (pixels[(i - 1) * squareSize + j + 1] == GRAY)
                        && (pixels[i * squareSize + j - 1] == GRAY)
                        && (pixels[i * squareSize + j + 1] == GRAY)
                        && (pixels[(i + 1) * squareSize + j - 1] == GRAY)
                        && (pixels[(i + 1) * squareSize + j] == GRAY)
                        && (pixels[(i + 1) * squareSize + j + 1] == GRAY)
                    )
                        insidePoints.Add(i * squareSize + j);
                    else
                        startingPoint = (i * squareSize + j);

                }
            }

            if (startingPoint == -1)
                return false;

            // paint inside points
            for (int i = 0; i < insidePoints.Count; i++)
            {
                pixels[insidePoints[i]] = BLACK;
            }

            // get the contour of the hand with a mask 3x3:
            // if the element in the mask position is a contour point (is GRAY) and it is not already in the contour list, put it in the contour list
            int nextPoint = startingPoint;
            int lookingPoint = -1;
            while (true)
            {
                lookingPoint = nextPoint;

                // test the valid points for the mask
                #region testPoints
                // see wich part of the mask 3x3 will be valid
                bool mask33 = (lookingPoint - squareSize - 1 >= 0);
                bool mask34 = (lookingPoint - squareSize >= 0);
                bool mask35 = (lookingPoint - squareSize + 1 >= 0);
                bool mask43 = (lookingPoint - 1 >= 0);
                bool mask45 = (lookingPoint + 1 < (squareSize * squareSize));
                bool mask53 = (lookingPoint + squareSize - 1 < (squareSize * squareSize));
                bool mask54 = (lookingPoint + squareSize < (squareSize * squareSize));
                bool mask55 = (lookingPoint + squareSize + 1 < (squareSize * squareSize));

                // which part of the mask 5x5
                bool mask22 = (lookingPoint - (squareSize * 2) - 2 >= 0);
                bool mask23 = (lookingPoint - (squareSize * 2) - 1 >= 0);
                bool mask24 = (lookingPoint - (squareSize * 2) >= 0);
                bool mask25 = (lookingPoint - (squareSize * 2) + 1 >= 0);
                bool mask26 = (lookingPoint - (squareSize * 2) + 2 >= 0);
                bool mask32 = (lookingPoint - squareSize - 2 >= 0);
                bool mask36 = (lookingPoint - squareSize + 2 >= 0);
                bool mask42 = (lookingPoint - 2 >= 0);
                bool mask46 = (lookingPoint + 2 < (squareSize * squareSize));
                bool mask52 = (lookingPoint + squareSize - 2 < (squareSize * squareSize));
                bool mask56 = (lookingPoint + squareSize + 2 < (squareSize * squareSize));
                bool mask62 = (lookingPoint + (squareSize * 2) - 2 < (squareSize * squareSize));
                bool mask63 = (lookingPoint + (squareSize * 2) - 1 < (squareSize * squareSize));
                bool mask64 = (lookingPoint + (squareSize * 2) < (squareSize * squareSize));
                bool mask65 = (lookingPoint + (squareSize * 2) + 1 < (squareSize * squareSize));
                bool mask66 = (lookingPoint + (squareSize * 2) + 2 < (squareSize * squareSize));

                // which part of the mask 7x7
                bool mask11 = (lookingPoint - (squareSize * 3) - 3 >= 0);
                bool mask12 = (lookingPoint - (squareSize * 3) - 2 >= 0);
                bool mask13 = (lookingPoint - (squareSize * 3) - 1 >= 0);
                bool mask14 = (lookingPoint - (squareSize * 3) >= 0);
                bool mask15 = (lookingPoint - (squareSize * 3) + 1 >= 0);
                bool mask16 = (lookingPoint - (squareSize * 3) + 2 >= 0);
                bool mask17 = (lookingPoint - (squareSize * 3) + 3 >= 0);
                bool mask21 = (lookingPoint - (squareSize * 2) - 3 >= 0);
                bool mask27 = (lookingPoint - (squareSize * 2) + 3 >= 0);
                bool mask31 = (lookingPoint - squareSize - 3 >= 0);
                bool mask37 = (lookingPoint - squareSize + 3 >= 0);
                bool mask41 = (lookingPoint - 3 >= 0);
                bool mask47 = (lookingPoint + 3 < (squareSize * squareSize));
                bool mask51 = (lookingPoint + squareSize - 3 < (squareSize * squareSize));
                bool mask57 = (lookingPoint + squareSize + 3 < (squareSize * squareSize));
                bool mask61 = (lookingPoint + (squareSize * 2) - 3 < (squareSize * squareSize));
                bool mask67 = (lookingPoint + (squareSize * 2) + 3 < (squareSize * squareSize));
                bool mask71 = (lookingPoint + (squareSize * 3) - 3 < (squareSize * squareSize));
                bool mask72 = (lookingPoint + (squareSize * 3) - 2 < (squareSize * squareSize));
                bool mask73 = (lookingPoint + (squareSize * 3) - 1 < (squareSize * squareSize));
                bool mask74 = (lookingPoint + (squareSize * 3) < (squareSize * squareSize));
                bool mask75 = (lookingPoint + (squareSize * 3) + 1 < (squareSize * squareSize));
                bool mask76 = (lookingPoint + (squareSize * 3) + 2 < (squareSize * squareSize));
                bool mask77 = (lookingPoint + (squareSize * 3) + 3 < (squareSize * squareSize));
                #endregion

                // make the tests according to the mask
                #region testMask
                // mask 3x3 first
                if (mask33 && (pixels[lookingPoint - squareSize - 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - squareSize - 1, squareSize)))
                {
                    nextPoint = lookingPoint - squareSize - 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask34 && (pixels[lookingPoint - squareSize] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - squareSize, squareSize)))
                {
                    nextPoint = lookingPoint - squareSize;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask35 && (pixels[lookingPoint - squareSize + 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - squareSize + 1, squareSize)))
                {
                    nextPoint = lookingPoint - squareSize + 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask43 && (pixels[lookingPoint - 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - 1, squareSize)))
                {
                    nextPoint = lookingPoint - 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask45 && (pixels[lookingPoint + 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + 1, squareSize)))
                {
                    nextPoint = lookingPoint + 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask53 && (pixels[lookingPoint + squareSize - 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + squareSize - 1, squareSize)))
                {
                    nextPoint = lookingPoint + squareSize - 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask54 && (pixels[lookingPoint + squareSize] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + squareSize, squareSize)))
                {
                    nextPoint = lookingPoint + squareSize;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask55 && (pixels[lookingPoint + squareSize + 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + squareSize + 1, squareSize)))
                {
                    nextPoint = lookingPoint + squareSize + 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                // then the rest of the 5x5 mask
                else if (mask22 && (pixels[lookingPoint - (squareSize * 2) - 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 2) - 2, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 2) - 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask23 && (pixels[lookingPoint - (squareSize * 2) - 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 2) - 1, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 2) - 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask24 && (pixels[lookingPoint - (squareSize * 2)] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 2), squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 2);
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask25 && (pixels[lookingPoint - (squareSize * 2) + 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 2) + 1, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 2) + 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask26 && (pixels[lookingPoint - (squareSize * 2) + 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 2) + 2, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 2) + 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask32 && (pixels[lookingPoint - squareSize - 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - squareSize - 2, squareSize)))
                {
                    nextPoint = lookingPoint - squareSize - 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask36 && (pixels[lookingPoint - squareSize + 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - squareSize + 2, squareSize)))
                {
                    nextPoint = lookingPoint - squareSize + 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask42 && (pixels[lookingPoint - 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - 2, squareSize)))
                {
                    nextPoint = lookingPoint - 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask46 && (pixels[lookingPoint + 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + 2, squareSize)))
                {
                    nextPoint = lookingPoint + 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask52 && (pixels[lookingPoint + squareSize - 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + squareSize - 2, squareSize)))
                {
                    nextPoint = lookingPoint + squareSize - 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask56 && (pixels[lookingPoint + squareSize + 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + squareSize + 2, squareSize)))
                {
                    nextPoint = lookingPoint + squareSize + 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask62 && (pixels[lookingPoint + (squareSize * 2) - 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 2) - 2, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 2) - 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask63 && (pixels[lookingPoint + (squareSize * 2) - 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 2) - 1, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 2) - 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask64 && (pixels[lookingPoint + (squareSize * 2)] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 2), squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 2);
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask65 && (pixels[lookingPoint + (squareSize * 2) + 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 2) + 1, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 2) + 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask66 && (pixels[lookingPoint + (squareSize * 2) + 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 2) + 2, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 2) + 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                // then the rest of the 7x7 mask
                else if (mask11 && (pixels[lookingPoint - (squareSize * 3) - 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 3) - 3, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 3) - 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask12 && (pixels[lookingPoint - (squareSize * 3) - 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 3) - 2, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 3) - 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask13 && (pixels[lookingPoint - (squareSize * 3) - 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 3) - 1, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 3) - 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask14 && (pixels[lookingPoint - (squareSize * 3)] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 3), squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 3);
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask15 && (pixels[lookingPoint - (squareSize * 3) + 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 3) + 1, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 3) + 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask16 && (pixels[lookingPoint - (squareSize * 3) + 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 3) + 2, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 3) + 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask17 && (pixels[lookingPoint - (squareSize * 3) + 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 3) + 3, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 3) + 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask21 && (pixels[lookingPoint - (squareSize * 2) - 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 2) - 3, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 2) - 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask27 && (pixels[lookingPoint - (squareSize * 2) + 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - (squareSize * 2) + 3, squareSize)))
                {
                    nextPoint = lookingPoint - (squareSize * 2) + 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask31 && (pixels[lookingPoint - squareSize - 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - squareSize - 3, squareSize)))
                {
                    nextPoint = lookingPoint - squareSize - 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask37 && (pixels[lookingPoint - squareSize + 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - squareSize + 3, squareSize)))
                {
                    nextPoint = lookingPoint - squareSize + 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask41 && (pixels[lookingPoint - 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint - 3, squareSize)))
                {
                    nextPoint = lookingPoint - 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask47 && (pixels[lookingPoint + 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + 3, squareSize)))
                {
                    nextPoint = lookingPoint + 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask51 && (pixels[lookingPoint + squareSize - 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + squareSize - 3, squareSize)))
                {
                    nextPoint = lookingPoint + squareSize - 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask57 && (pixels[lookingPoint + squareSize + 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + squareSize + 3, squareSize)))
                {
                    nextPoint = lookingPoint + squareSize + 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask61 && (pixels[lookingPoint + (squareSize * 2) - 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 2) - 3, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 2) - 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask67 && (pixels[lookingPoint + (squareSize * 2) + 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 2) + 3, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 2) + 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask71 && (pixels[lookingPoint + (squareSize * 3) - 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 3) - 3, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 3) - 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask72 && (pixels[lookingPoint + (squareSize * 3) - 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 3) - 2, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 3) - 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask73 && (pixels[lookingPoint + (squareSize * 3) - 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 3) - 1, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 3) - 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask74 && (pixels[lookingPoint + (squareSize * 3)] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 3), squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 3);
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask75 && (pixels[lookingPoint + (squareSize * 3) + 1] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 3) + 1, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 3) + 1;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask76 && (pixels[lookingPoint + (squareSize * 3) + 2] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 3) + 2, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 3) + 2;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else if (mask77 && (pixels[lookingPoint + (squareSize * 3) + 3] == GRAY) && !contourPoints.Contains(indexToPoint(lookingPoint + (squareSize * 3) + 3, squareSize)))
                {
                    nextPoint = lookingPoint + (squareSize * 3) + 3;
                    contourPoints.Add(indexToPoint(nextPoint, squareSize));
                }
                else
                    break;
                #endregion
            }

            // see if the hand is opened or closed using the k-curvature algorithm
            Point p1 = new Point(), p2 = new Point(), p3 = new Point();
            float angle;
            int fingerpointCount = 0;
            for (int i = pointsInterval; i < contourPoints.Count - pointsInterval; i++)
            {
                p1 = contourPoints[i - pointsInterval];
                p2 = contourPoints[i];
                p3 = contourPoints[i + pointsInterval];

                angle = getAngleBetweenPoints(p1, p2, p3) * 180 / (float)Math.PI;

                if (angle <= limitAngleToBeFingertip)
                {
                    fingerpointCount++;
                    i += pointsInterval;
                }
            }

            if (fingerpointCount <= fingertipLimit)
            {
                return true;
            }

            return false;
        }

        private static int pointToIndex(Point p, int width)
        {
            return (int)p.X * width + (int)p.Y;
        }

        private static int pointToIndex(double x, double y, int width)
        {
            return (int)x * width + (int)y;
        }

        private static Point indexToPoint(int index, int width)
        {
            Point p = new Point((int)(index / width), index % width);
            return p;
        }

        private static float getAngleBetweenPoints(Point p1, Point p2, Point p3)
        {
            double angle;

            Vector v1 = p2 - p1;
            Vector v2 = p2 - p3;

            v1.Normalize();
            v2.Normalize();

            angle = Math.Acos(v1 * v2);

            return (float)angle;
        }

        private static float getAngleBetweenPoints(SkeletonPoint p1, SkeletonPoint p2, SkeletonPoint p3)
        {
            double angle;

            Vector v1 = new Vector(p2.X - p1.X, p2.Y - p1.Y);
            Vector v2 = new Vector(p2.X - p3.X, p2.Y - p3.Y);

            v1.Normalize();
            v2.Normalize();

            angle = Math.Acos(v1 * v2);

            return (float)angle;
        }

        private static int getDistance(DepthImagePoint p1, DepthImagePoint p2)
        {
            int dist = (int)Math.Sqrt(Math.Pow(p1.X - p2.X, 2.0) + Math.Pow(p1.Y - p2.Y, 2.0));

            return dist;
        }

        private static double BalanceXAxis(double value)
        {
            value = (value - (double)RESX / 2.0) * 3.0 + ((double)RESX / 2.0);
            if (value > (double)RESX)
                value = (double)RESX;
            if (value < 0.0)
                value = 0.0;
            return value;
        }

        private static double BalanceYAxis(double value)
        {
            value = (value - (double)RESY / 2.0) * 3.0 + ((double)RESY / 2.0);
            if (value > (double)RESY)
                value = (double)RESY;
            if (value < 0.0)
                value = 0.0;
            return value;
        }
    }
}
