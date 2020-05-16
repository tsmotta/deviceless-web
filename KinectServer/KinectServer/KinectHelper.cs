using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using Microsoft.Kinect;
using System.IO;
using System.Text;
using System.Runtime.Serialization;

namespace KinectServer
{
    internal static class SkeletalCommonExtensions
    {
        public static Joint ScaleTo(this Joint joint, int width, int height, float skeletonMaxX, float skeletonMaxY)
        {
            Microsoft.Kinect.SkeletonPoint pos = new SkeletonPoint()
            {
                X = Scale(width, skeletonMaxX, joint.Position.X),
                Y = Scale(height, skeletonMaxY, -joint.Position.Y),
                Z = joint.Position.Z
            };

            joint.Position = pos;

            return joint;
        }

        public static Joint ScaleTo(this Joint joint, int width, int height)
        {
            return ScaleTo(joint, width, height, 1.0f, 1.0f);
        }

        private static float Scale(int maxPixel, float maxSkeleton, float position)
        {
            float value = ((((maxPixel / maxSkeleton) / 2) * position) + (maxPixel / 2));
            if (value > maxPixel)
                return maxPixel;
            if (value < 0)
                return 0;
            return value;
        }
    }
}
