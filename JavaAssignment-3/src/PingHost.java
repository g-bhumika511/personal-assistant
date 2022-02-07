import java.util.Scanner;
import java.io.*;
import java.net.*;

public class PingHost {
    public static void main(String[] args)throws UnknownHostException,IOException{

        Scanner keyboard=new Scanner(System.in);
        String ipAddress;
        System.out.println("Enter the IP address :\t");
        ipAddress=keyboard.nextLine();
        pingHost(ipAddress);

    }
    public static void pingHost(String ipAddress) throws UnknownHostException, IOException{
        try {
            final double beginTime=System.currentTimeMillis();
            System.out.println("Starting time: "+beginTime);

            InetAddress host=InetAddress.getByName(ipAddress);

            System.out.println("Sending ping request to "+ipAddress);
            System.out.println(); //for spacing
            double time=System.nanoTime();//to calculate time reaching the host

            if(host.isReachable(5000)) {
                final double medianTime=(System.currentTimeMillis()-beginTime)/2;
                System.out.println("Reached host in "+time+" nanoseconds " +"\ncurrent time "+System.currentTimeMillis());
                System.out.println("Median of the time taken to ping: "+medianTime+" milliseconds");
            }

        }
        catch(UnknownHostException ex){
            System.out.println("host cannot be found!");
        }


    }
}
